// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/governance/TimelockController.sol";

/// @notice Self-administered governance with a fixed delay and an immutable administrative root.
contract LazyArtGovernance is TimelockController {
    uint256 public immutable minimumDelay;
    error InvalidGovernance();
    constructor(uint256 delay_, address[] memory proposers, address[] memory executors)
        TimelockController(delay_, proposers, executors, address(0)) {
        if(delay_ == 0 || proposers.length == 0 || executors.length == 0) revert InvalidGovernance();
        for(uint256 i; i < proposers.length; ++i) if(proposers[i] == address(0)) revert InvalidGovernance();
        for(uint256 i; i < executors.length; ++i) if(executors[i] == address(0)) revert InvalidGovernance();
        minimumDelay = delay_;
    }
    function updateDelay(uint256) external pure override { revert InvalidGovernance(); }
    function _grantRole(bytes32 role, address account) internal override returns(bool) {
        if(account == address(0) || (role == DEFAULT_ADMIN_ROLE && account != address(this))) revert InvalidGovernance();
        return super._grantRole(role, account);
    }
    function _revokeRole(bytes32 role, address account) internal override returns(bool) {
        if(role == DEFAULT_ADMIN_ROLE) revert InvalidGovernance();
        return super._revokeRole(role, account);
    }
}

/// @notice Immutable ERC20 monetary envelope; replaceable modules never gain mint authority.
/// @dev Gross issuance includes bootstrap issuance. Burns never restore any mint allowance.
contract LazyArtCoinV2 is ERC20, ERC20Burnable, ERC20Permit {
    struct Limits { uint192 lifetime; uint192 rollingYear; uint192 epoch; uint192 initialAllowance; uint64 epochSeconds; }
    struct Checkpoint { uint64 timestamp; uint192 cumulative; }
    uint256 public constant YEAR = 365 days;
    address public immutable treasury;
    address public immutable governance;
    uint256 public immutable lifetimeGrossCap;
    uint256 public immutable rollingYearGrossCap;
    uint256 public immutable epochGrossCap;
    uint256 public immutable epochDuration;
    uint256 public immutable epochOrigin;
    address public guardian;
    uint256 public epochAllowance;
    uint256 public grossIssued;
    bool public mintPaused;
    mapping(uint256 => uint256) public epochGrossMinted;
    Checkpoint[] private history;
    error InvalidConfiguration(); error GovernanceOnly(); error GuardianOnly();
    error MintLimit(); error MintPaused(); error ZeroAmount();
    event Issued(uint256 indexed epoch, uint256 amount, uint256 cumulative);
    event AllowanceChanged(uint256 allowance);
    event GuardianChanged(address indexed guardian);
    event MintPauseChanged(bool paused);
    constructor(address treasury_, address governance_, address guardian_, uint256 initialSupply, Limits memory limits)
        ERC20("LazyArtCoin", "LAC") ERC20Permit("LazyArtCoin") {
        if(treasury_ == address(0) || treasury_ == address(this) || governance_.code.length == 0 || guardian_ == address(0)
            || limits.lifetime == 0 || limits.rollingYear == 0 || limits.rollingYear > limits.lifetime
            || limits.epoch == 0 || limits.epoch > limits.rollingYear || limits.initialAllowance > limits.epoch
            || limits.epochSeconds == 0 || limits.epochSeconds > YEAR || initialSupply > limits.initialAllowance) revert InvalidConfiguration();
        treasury = treasury_; governance = governance_; guardian = guardian_;
        lifetimeGrossCap = limits.lifetime; rollingYearGrossCap = limits.rollingYear;
        epochGrossCap = limits.epoch; epochAllowance = limits.initialAllowance;
        epochDuration = limits.epochSeconds; epochOrigin = block.timestamp;
        if(initialSupply != 0) _mint(treasury_, initialSupply);
    }
    modifier onlyGovernance(){ if(msg.sender != governance) revert GovernanceOnly(); _; }
    function currentEpoch() public view returns(uint256){ return (block.timestamp - epochOrigin) / epochDuration; }
    /// @notice Exact half-open rolling interval (now - 365 days, now], using binary search.
    function rollingYearGrossMinted() public view returns(uint256){
        if(block.timestamp < YEAR) return grossIssued;
        uint256 cutoff = block.timestamp - YEAR;
        uint256 low; uint256 high = history.length;
        while(low < high){ uint256 mid = (low + high) / 2; if(history[mid].timestamp <= cutoff) low = mid + 1; else high = mid; }
        return grossIssued - (low == 0 ? 0 : history[low - 1].cumulative);
    }
    function issuanceCheckpointCount() external view returns(uint256){ return history.length; }
    function mint(uint256 amount) external onlyGovernance { if(amount == 0) revert ZeroAmount(); _mint(treasury, amount); }
    function setEpochAllowance(uint256 amount) external onlyGovernance {
        if(amount > epochGrossCap) revert MintLimit(); epochAllowance = amount; emit AllowanceChanged(amount);
    }
    function setGuardian(address next) external onlyGovernance {
        if(next == address(0)) revert InvalidConfiguration(); guardian = next; emit GuardianChanged(next);
    }
    function pauseMint() external { if(msg.sender != guardian && msg.sender != governance) revert GuardianOnly(); mintPaused = true; emit MintPauseChanged(true); }
    function resumeMint() external onlyGovernance { mintPaused = false; emit MintPauseChanged(false); }
    function _update(address from, address to, uint256 amount) internal override {
        if(from == address(0)){
            if(mintPaused) revert MintPaused();
            uint256 epoch = currentEpoch(); uint256 used = epochGrossMinted[epoch];
            if(amount > lifetimeGrossCap - grossIssued || amount > rollingYearGrossCap - rollingYearGrossMinted()
                || used > epochAllowance || amount > epochAllowance - used) revert MintLimit();
            grossIssued += amount; epochGrossMinted[epoch] = used + amount;
            if(history.length > 0 && history[history.length - 1].timestamp == block.timestamp) history[history.length - 1].cumulative = uint192(grossIssued);
            else history.push(Checkpoint(uint64(block.timestamp), uint192(grossIssued)));
            emit Issued(epoch, amount, grossIssued);
        }
        super._update(from, to, amount);
    }
}
