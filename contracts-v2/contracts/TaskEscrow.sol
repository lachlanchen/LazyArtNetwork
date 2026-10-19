// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @notice Prefunded robot/agent/human tasks with independent review and bounded disputes.
/// Keys that submit work never receive unrestricted treasury or mint authority.
contract TaskEscrow is ReentrancyGuard {
    using SafeERC20 for IERC20;
    enum Status { Missing, Offered, Accepted, Submitted, Approved, Rejected, Disputed, Settled }
    struct Terms {
        address worker; address payee; address verifier; address arbiter;
        uint256 amount; uint64 workDeadline; uint32 reviewSeconds; uint32 challengeSeconds;
        uint32 arbitrationSeconds; uint16 timeoutPayeeBps; bytes32 termsHash;
    }
    struct Task { address requester; Terms terms; Status status; uint64 actionDeadline; bytes32 resultHash; uint256 paid; }
    IERC20 public immutable token;
    address public immutable governance;
    address public guardian;
    uint256 public immutable perTaskLimit;
    uint256 public reserved;
    bool public newTasksPaused;
    mapping(bytes32 => Task) public tasks;
    error InvalidTask(); error Unauthorized(); error WrongState(); error TooEarly(); error InexactTransfer();
    event TaskCreated(bytes32 indexed id, address indexed requester, address indexed payee, bytes32 termsHash, uint256 amount);
    event TaskTransition(bytes32 indexed id, Status status, uint64 actionDeadline, bytes32 evidenceHash);
    event TaskSettled(bytes32 indexed id, address indexed payee, uint256 paid, uint256 refunded);
    event NewTasksPauseChanged(bool paused); event GuardianChanged(address indexed guardian);
    constructor(IERC20 token_, address governance_, address guardian_, uint256 perTaskLimit_) {
        if(address(token_).code.length == 0 || governance_.code.length == 0 || guardian_ == address(0) || perTaskLimit_ == 0) revert InvalidTask();
        token = token_; governance = governance_; guardian = guardian_; perTaskLimit = perTaskLimit_;
    }
    function create(bytes32 id, Terms calldata t) external nonReentrant {
        if(newTasksPaused || id == bytes32(0) || tasks[id].status != Status.Missing || t.amount == 0 || t.amount > perTaskLimit
            || t.worker == address(0) || t.payee == address(0) || t.payee == address(this) || t.verifier == address(0) || t.arbiter == address(0)
            || t.worker == msg.sender || t.payee == msg.sender || t.verifier == t.worker || t.verifier == t.payee || t.verifier == msg.sender
            || t.arbiter == t.worker || t.arbiter == t.payee || t.arbiter == t.verifier || t.arbiter == msg.sender
            || t.workDeadline <= block.timestamp || t.workDeadline > block.timestamp + 365 days || t.termsHash == bytes32(0)
            || t.reviewSeconds == 0 || t.reviewSeconds > 30 days || t.challengeSeconds == 0 || t.challengeSeconds > 30 days
            || t.arbitrationSeconds == 0 || t.arbitrationSeconds > 90 days || t.timeoutPayeeBps > 10000) revert InvalidTask();
        uint256 balance = token.balanceOf(address(this)); uint256 senderBalance = token.balanceOf(msg.sender);
        token.safeTransferFrom(msg.sender, address(this), t.amount);
        if(token.balanceOf(address(this)) != balance + t.amount || token.balanceOf(msg.sender) != senderBalance - t.amount) revert InexactTransfer();
        reserved += t.amount;
        Task storage task = tasks[id]; task.requester = msg.sender; task.terms = t; task.status = Status.Offered; task.actionDeadline = t.workDeadline;
        emit TaskCreated(id, msg.sender, t.payee, t.termsHash, t.amount);
    }
    function accept(bytes32 id) external {
        Task storage t = tasks[id]; if(msg.sender != t.terms.worker) revert Unauthorized();
        if(newTasksPaused || t.status != Status.Offered || block.timestamp >= t.terms.workDeadline) revert WrongState();
        _state(id,t,Status.Accepted,t.terms.workDeadline,bytes32(0));
    }
    function submit(bytes32 id, bytes32 resultHash) external {
        Task storage t = tasks[id]; if(msg.sender != t.terms.worker) revert Unauthorized();
        if(t.status != Status.Accepted || block.timestamp >= t.terms.workDeadline || resultHash == bytes32(0)) revert WrongState();
        t.resultHash = resultHash;
        _state(id,t,Status.Submitted,uint64(block.timestamp + t.terms.reviewSeconds),resultHash);
    }
    function review(bytes32 id, bool approved, bytes32 evidenceHash) external {
        Task storage t = tasks[id]; if(msg.sender != t.terms.verifier) revert Unauthorized();
        if(t.status != Status.Submitted || block.timestamp >= t.actionDeadline || evidenceHash == bytes32(0)) revert WrongState();
        _state(id,t,approved ? Status.Approved : Status.Rejected,uint64(block.timestamp + t.terms.challengeSeconds),evidenceHash);
    }
    function dispute(bytes32 id, bytes32 evidenceHash) external {
        Task storage t = tasks[id];
        if(msg.sender != t.requester && msg.sender != t.terms.worker && msg.sender != t.terms.payee) revert Unauthorized();
        if((t.status != Status.Submitted && t.status != Status.Approved && t.status != Status.Rejected) || block.timestamp >= t.actionDeadline || evidenceHash == bytes32(0)) revert WrongState();
        _state(id,t,Status.Disputed,uint64(block.timestamp + t.terms.arbitrationSeconds),evidenceHash);
    }
    function resolve(bytes32 id, uint256 payeeAmount, bytes32 evidenceHash) external nonReentrant {
        Task storage t = tasks[id]; if(msg.sender != t.terms.arbiter) revert Unauthorized();
        if(t.status != Status.Disputed || block.timestamp >= t.actionDeadline || payeeAmount > t.terms.amount || evidenceHash == bytes32(0)) revert WrongState();
        emit TaskTransition(id,Status.Settled,0,evidenceHash); _settle(id,t,payeeAmount);
    }
    function cancelOffer(bytes32 id) external nonReentrant {
        Task storage t = tasks[id]; if(msg.sender != t.requester) revert Unauthorized();
        if(t.status != Status.Offered) revert WrongState(); _settle(id,t,0);
    }
    /// @notice Permissionless liveness. Unreviewed results escalate; arbitration timeout
    /// uses the payout split accepted in the original terms, not an admin-selected outcome.
    function finalize(bytes32 id) external nonReentrant {
        Task storage t = tasks[id]; if(t.status == Status.Missing || t.status == Status.Settled) revert WrongState();
        if(block.timestamp < t.actionDeadline) revert TooEarly();
        if(t.status == Status.Submitted){ _state(id,t,Status.Disputed,uint64(block.timestamp + t.terms.arbitrationSeconds),bytes32(0)); return; }
        uint256 amount;
        if(t.status == Status.Approved) amount = t.terms.amount;
        else if(t.status == Status.Disputed) amount = t.terms.amount / 10000 * t.terms.timeoutPayeeBps + (t.terms.amount % 10000) * t.terms.timeoutPayeeBps / 10000;
        _settle(id,t,amount);
    }
    function pauseNewTasks() external { if(msg.sender != guardian && msg.sender != governance) revert Unauthorized(); newTasksPaused = true; emit NewTasksPauseChanged(true); }
    function resumeNewTasks() external { if(msg.sender != governance) revert Unauthorized(); newTasksPaused = false; emit NewTasksPauseChanged(false); }
    function setGuardian(address next) external { if(msg.sender != governance || next == address(0)) revert Unauthorized(); guardian = next; emit GuardianChanged(next); }
    function _state(bytes32 id, Task storage t, Status status, uint64 deadline, bytes32 evidence) private {
        t.status = status; t.actionDeadline = deadline; emit TaskTransition(id,status,deadline,evidence);
    }
    function _settle(bytes32 id, Task storage t, uint256 paid) private {
        t.status = Status.Settled; t.paid = paid; reserved -= t.terms.amount;
        if(paid != 0) _send(t.terms.payee,paid);
        if(t.terms.amount != paid) _send(t.requester,t.terms.amount - paid);
        if(token.balanceOf(address(this)) < reserved) revert InexactTransfer();
        emit TaskSettled(id,t.terms.payee,paid,t.terms.amount - paid);
    }
    function _send(address to, uint256 amount) private {
        uint256 beforeFrom = token.balanceOf(address(this)); uint256 beforeTo = token.balanceOf(to);
        token.safeTransfer(to,amount);
        if(token.balanceOf(address(this)) != beforeFrom - amount || token.balanceOf(to) != beforeTo + amount) revert InexactTransfer();
    }
}
