// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

/// @notice Prefunded, irrevocable, linear token grants. No USD/value guarantee.
/// @dev Supports a reviewed, exact-transfer, non-rebasing ERC20 only. No proxy,
/// minting, investment, spending approval, administrative beneficiary change or reserved-fund rescue.
/// A governance controller (e.g. the companion timelock) must be explicitly supplied.
contract FunDGrantVault is ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public constant MAX_DURATION = 3650 days;
    IERC20 public immutable token;
    address public immutable governanceController;
    address public immutable treasury;
    uint256 public totalOutstanding;

    struct Grant {
        address beneficiary;
        uint64 start;
        uint64 duration;
        uint256 amount;
        uint256 released;
    }

    // Entries, including completed grants, are permanent replay tombstones.
    mapping(bytes32 grantId => Grant) public grants;
    mapping(bytes32 grantId => address) public nominatedBeneficiary;
    event BeneficiaryNominated(bytes32 indexed grantId, address indexed nominee);
    event BeneficiaryChanged(bytes32 indexed grantId, address indexed previous, address indexed beneficiary);

    error InvalidAddress();
    error InvalidToken();
    error GovernanceOnly();
    error InvalidGrant();
    error GrantAlreadyExists();
    error GrantNotFound();
    error InsufficientUnreservedFunds();
    error Insolvent();
    error NothingToRelease();
    error InexactTransfer();

    event GrantCreated(bytes32 indexed grantId, address indexed beneficiary,
                       uint256 amount, uint64 start, uint64 duration);
    event GrantReleased(bytes32 indexed grantId, address indexed beneficiary,
                        uint256 amount, uint256 totalReleased);
    event ExcessRecovered(address indexed treasury, uint256 amount);

    constructor(IERC20 token_, address governanceController_, address treasury_) {
        if (address(token_) == address(0) || governanceController_.code.length == 0
            || treasury_ == address(0) || treasury_ == address(this)
            || governanceController_ == address(this)) revert InvalidAddress();
        if (address(token_).code.length == 0) revert InvalidToken();
        token = token_;
        governanceController = governanceController_;
        treasury = treasury_;
    }

    modifier onlyGovernance() {
        if (msg.sender != governanceController) revert GovernanceOnly();
        _;
    }

    /// @notice Reserve already-deposited tokens. No backdating or implied funding.
    /// @dev Terms cannot be edited or canceled, even by governance. Duration is
    /// explicit: 3650 days is a maximum/example, not a default economic promise.
    function createGrant(bytes32 grantId, address beneficiary, uint256 amount,
                         uint64 start, uint64 duration) external onlyGovernance nonReentrant {
        if (grantId == bytes32(0) || amount == 0 || start < block.timestamp
            || duration == 0 || duration > MAX_DURATION
            || uint256(start) + duration > type(uint64).max) revert InvalidGrant();
        if (beneficiary == address(0) || beneficiary == address(this)) revert InvalidAddress();
        if (grants[grantId].amount != 0) revert GrantAlreadyExists();
        if (amount > unreservedBalance()) revert InsufficientUnreservedFunds();
        grants[grantId] = Grant(beneficiary, start, duration, amount, 0);
        totalOutstanding += amount;
        emit GrantCreated(grantId, beneficiary, amount, start, duration);
    }

    /// @notice Only the current beneficiary may nominate its replacement. Governance
    /// cannot confiscate a grant through account recovery. Nominee must accept.
    function nominateBeneficiary(bytes32 grantId, address nominee) external {
        if (msg.sender != grants[grantId].beneficiary) revert InvalidAddress();
        if (nominee == address(this)) revert InvalidAddress();
        nominatedBeneficiary[grantId] = nominee;
        emit BeneficiaryNominated(grantId, nominee);
    }
    function acceptBeneficiary(bytes32 grantId) external {
        if (msg.sender != nominatedBeneficiary[grantId]) revert InvalidAddress();
        address previous = grants[grantId].beneficiary;
        grants[grantId].beneficiary = msg.sender;
        delete nominatedBeneficiary[grantId];
        emit BeneficiaryChanged(grantId, previous, msg.sender);
    }

    function vestedAmount(bytes32 grantId, uint256 timestamp) public view returns (uint256) {
        Grant storage grant = grants[grantId];
        if (grant.amount == 0) revert GrantNotFound();
        if (timestamp <= grant.start) return 0;
        uint256 elapsed = timestamp - grant.start;
        if (elapsed >= grant.duration) return grant.amount;
        return Math.mulDiv(grant.amount, elapsed, grant.duration);
    }

    function releasable(bytes32 grantId) public view returns (uint256) {
        return vestedAmount(grantId, block.timestamp) - grants[grantId].released;
    }

    /// @notice Anyone may trigger release; the stored beneficiary always receives it.
    /// Failed/paused token transfers revert all accounting. There is no admin bypass.
    function release(bytes32 grantId) external nonReentrant returns (uint256 amount) {
        amount = releasable(grantId);
        if (amount == 0) revert NothingToRelease();
        Grant storage grant = grants[grantId];
        uint256 beforeBalance = token.balanceOf(address(this));
        if (beforeBalance < totalOutstanding) revert Insolvent();
        grant.released += amount;
        totalOutstanding -= amount;
        _transferExact(grant.beneficiary, amount, beforeBalance);
        emit GrantReleased(grantId, grant.beneficiary, amount, grant.released);
    }

    /// @notice Free funds only; vested but unclaimed tokens remain fully reserved.
    function unreservedBalance() public view returns (uint256) {
        uint256 balance = token.balanceOf(address(this));
        if (balance < totalOutstanding) revert Insolvent();
        return balance - totalOutstanding;
    }

    /// @notice Governance may recover only excess of this token to the fixed treasury.
    function recoverExcess(uint256 amount) external onlyGovernance nonReentrant {
        if (amount == 0) revert InvalidGrant();
        uint256 beforeBalance = token.balanceOf(address(this));
        if (beforeBalance < totalOutstanding) revert Insolvent();
        if (amount > beforeBalance - totalOutstanding) revert InsufficientUnreservedFunds();
        _transferExact(treasury, amount, beforeBalance);
        emit ExcessRecovered(treasury, amount);
    }

    function _transferExact(address recipient, uint256 amount, uint256 beforeBalance) private {
        uint256 recipientBefore = token.balanceOf(recipient);
        token.safeTransfer(recipient, amount);
        uint256 afterBalance = token.balanceOf(address(this));
        uint256 recipientAfter = token.balanceOf(recipient);
        if (afterBalance > beforeBalance || beforeBalance - afterBalance != amount
            || recipientAfter < recipientBefore || recipientAfter - recipientBefore != amount) {
            revert InexactTransfer();
        }
        if (afterBalance < totalOutstanding) revert Insolvent();
    }
}
