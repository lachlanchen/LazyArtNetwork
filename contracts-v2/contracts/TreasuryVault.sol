// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @notice Prefunded spending envelopes. Operators cannot redirect budget recipients.
contract TreasuryVault is ReentrancyGuard {
    using SafeERC20 for IERC20;
    struct Budget {
        IERC20 token; address operator; address recipient;
        uint64 start; uint64 expiry; uint64 epochSeconds;
        uint256 limit; uint256 perEpoch; uint256 spent; bool closed;
    }
    address public immutable governance;
    address public guardian;
    bool public paused;
    mapping(bytes32 => Budget) public budgets;
    mapping(bytes32 => mapping(uint256 => uint256)) public epochSpent;
    mapping(address => uint256) public reserved;
    error Unauthorized(); error InvalidBudget(); error InsufficientBacking(); error InexactTransfer();
    event BudgetCreated(bytes32 indexed id, address indexed token, address indexed recipient, address operator, uint256 limit, uint256 perEpoch, uint64 epochSeconds, uint64 expiry);
    event BudgetSpent(bytes32 indexed id, address indexed recipient, uint256 amount);
    event BudgetClosed(bytes32 indexed id, uint256 unreserved);
    event PauseChanged(bool paused); event GuardianChanged(address indexed guardian);
    constructor(address governance_, address guardian_) {
        if(governance_.code.length == 0 || guardian_ == address(0)) revert InvalidBudget();
        governance = governance_; guardian = guardian_;
    }
    modifier onlyGovernance(){ if(msg.sender != governance) revert Unauthorized(); _; }
    function createBudget(bytes32 id, IERC20 token, address operator, address recipient,
        uint256 limit, uint256 perEpoch, uint64 epochSeconds, uint64 expiry) external onlyGovernance {
        if(paused || id == bytes32(0) || address(budgets[id].token) != address(0) || address(token).code.length == 0
            || operator == address(0) || recipient == address(0) || recipient == address(this)
            || limit == 0 || perEpoch == 0 || perEpoch > limit || epochSeconds == 0 || expiry <= block.timestamp) revert InvalidBudget();
        if(token.balanceOf(address(this)) < reserved[address(token)] + limit) revert InsufficientBacking();
        budgets[id] = Budget(token, operator, recipient, uint64(block.timestamp), expiry, epochSeconds, limit, perEpoch, 0, false);
        reserved[address(token)] += limit;
        emit BudgetCreated(id, address(token), recipient, operator, limit, perEpoch, epochSeconds, expiry);
    }
    function spend(bytes32 id, uint256 amount) external nonReentrant {
        Budget storage b = budgets[id];
        if(msg.sender != b.operator) revert Unauthorized();
        if(paused || b.closed || block.timestamp >= b.expiry || amount == 0 || amount > b.limit - b.spent) revert InvalidBudget();
        uint256 epoch = (block.timestamp - b.start) / b.epochSeconds;
        if(amount > b.perEpoch - epochSpent[id][epoch]) revert InvalidBudget();
        if(b.token.balanceOf(address(this)) < reserved[address(b.token)]) revert InsufficientBacking();
        b.spent += amount; epochSpent[id][epoch] += amount; reserved[address(b.token)] -= amount;
        _send(b.token, b.recipient, amount);
        emit BudgetSpent(id, b.recipient, amount);
    }
    /// @notice Cancelling an unspent operational budget does not claw back paid grants.
    function closeBudget(bytes32 id) external {
        Budget storage b = budgets[id];
        if(address(b.token) == address(0) || b.closed) revert InvalidBudget();
        if(msg.sender != governance && block.timestamp < b.expiry) revert Unauthorized();
        b.closed = true; uint256 amount = b.limit - b.spent; reserved[address(b.token)] -= amount;
        emit BudgetClosed(id, amount);
    }
    function recoverUnreserved(IERC20 token, address recipient, uint256 amount) external onlyGovernance nonReentrant {
        if(recipient == address(0) || recipient == address(this) || amount == 0) revert InvalidBudget();
        uint256 balance = token.balanceOf(address(this));
        if(balance < reserved[address(token)] || amount > balance - reserved[address(token)]) revert InsufficientBacking();
        _send(token, recipient, amount);
    }
    function pause() external { if(msg.sender != guardian && msg.sender != governance) revert Unauthorized(); paused = true; emit PauseChanged(true); }
    function resume() external onlyGovernance { paused = false; emit PauseChanged(false); }
    function setGuardian(address next) external onlyGovernance { if(next == address(0)) revert InvalidBudget(); guardian = next; emit GuardianChanged(next); }
    function _send(IERC20 token, address recipient, uint256 amount) private {
        uint256 from = token.balanceOf(address(this)); uint256 to = token.balanceOf(recipient);
        token.safeTransfer(recipient, amount);
        if(token.balanceOf(address(this)) != from - amount || token.balanceOf(recipient) != to + amount) revert InexactTransfer();
    }
}

/// @notice Versioned discovery for modules, governed by a separate, slower timelock.
/// No delegatecall, allowance or mint authority is conferred by registration.
contract LazyArtModuleRegistry {
    struct Module { address implementation; bytes32 codeHash; uint64 version; }
    address public immutable governance;
    mapping(bytes32 => Module) public modules;
    event ModuleSet(bytes32 indexed id, address indexed implementation, uint64 version, bytes32 codeHash);
    error InvalidModule();
    constructor(address governance_){ if(governance_.code.length == 0) revert InvalidModule(); governance = governance_; }
    function setModule(bytes32 id, address implementation, uint64 version) external {
        if(msg.sender != governance || id == bytes32(0) || implementation.code.length == 0 || version <= modules[id].version) revert InvalidModule();
        bytes32 hash = implementation.codehash; modules[id] = Module(implementation, hash, version);
        emit ModuleSet(id, implementation, version, hash);
    }
    function retireModule(bytes32 id, uint64 version) external {
        if(msg.sender != governance || modules[id].implementation == address(0) || version <= modules[id].version) revert InvalidModule();
        modules[id] = Module(address(0), bytes32(0), version);
        emit ModuleSet(id,address(0),version,bytes32(0));
    }

}
