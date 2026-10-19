// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/// @notice Prefunded, one-to-one native/ERC20 migration corridor. No mint authority.
/// @dev Remote finalized deposits require an ordered quorum of attestations.
/// Both endpoints and reserve allocation must be qualified before enablement.
contract NetworkMigrationEscrow is ReentrancyGuard, EIP712 {
    using SafeERC20 for IERC20;
    struct Transfer {
        uint256 sourceChain;
        address sourceBridge;
        uint256 nonce;
        address sender;
        address recipient;
        uint256 amount;
        bytes32 transactionHash;
        uint256 logIndex;
        uint256 signerEpoch;
        uint256 deadline;
    }
    bytes32 public constant TRANSFER_TYPEHASH = keccak256("Transfer(uint256 sourceChain,address sourceBridge,uint256 nonce,address sender,address recipient,uint256 amount,bytes32 transactionHash,uint256 logIndex,uint256 signerEpoch,uint256 deadline)");
    address public immutable asset; // zero = native LAC; nonzero = exact ERC20
    address public immutable governance;
    address public immutable guardian;
    uint256 public immutable remoteChain;
    uint256 public immutable perTransferCap;
    uint256 public immutable dailyCap;
    uint256 public immutable lifetimeOutboundCap;
    uint256 public immutable lifetimeInboundCap;
    address public remoteBridge;
    bool public enabled;
    bool public paused;
    bool public outboundRetired;
    uint256 public nonce;
    uint256 public totalDeposited;
    uint256 public totalReleased;
    uint256 public signerEpoch;
    uint256 public threshold;
    address[] private signerList;
    mapping(address => bool) public signer;
    mapping(bytes32 => bool) public processed;
    mapping(uint256 => uint256) public dailyDeposited;
    mapping(uint256 => uint256) public dailyReleased;
    error InvalidConfiguration(); error Unauthorized(); error Unavailable();
    error InvalidTransfer(); error Capacity(); error InvalidQuorum(); error AlreadyProcessed();
    event Funded(address indexed sender, uint256 amount);
    event Paired(uint256 remoteChain, address remoteBridge);
    event SignersChanged(uint256 indexed epoch, uint256 threshold, address[] signers);
    event StatusChanged(bool enabled, bool paused, bool outboundRetired);
    event Deposited(uint256 indexed nonce, address indexed sender, address indexed recipient, uint256 amount, uint256 destinationChain, address destinationBridge);
    event Released(bytes32 indexed messageId, address indexed recipient, uint256 amount, bytes32 sourceTransaction);

    constructor(address asset_, address governance_, address guardian_, uint256 remoteChain_,
                uint256 perTransfer_, uint256 daily_, uint256 outbound_, uint256 inbound_)
        EIP712("LazyArt Network Migration", "1") {
        if ((asset_ != address(0) && asset_.code.length == 0) || governance_.code.length == 0
            || guardian_ == address(0) || remoteChain_ == 0 || remoteChain_ == block.chainid
            || perTransfer_ == 0 || daily_ < perTransfer_ || outbound_ < daily_ || inbound_ < daily_)
            revert InvalidConfiguration();
        asset=asset_; governance=governance_; guardian=guardian_; remoteChain=remoteChain_;
        perTransferCap=perTransfer_; dailyCap=daily_; lifetimeOutboundCap=outbound_; lifetimeInboundCap=inbound_;
    }
    modifier onlyGovernance() { if(msg.sender != governance) revert Unauthorized(); _; }
    function pair(address remote) external onlyGovernance {
        if(remoteBridge != address(0) || remote == address(0)) revert InvalidConfiguration();
        remoteBridge=remote; emit Paired(remoteChain,remote);
    }
    function setSigners(address[] calldata next, uint256 required) external onlyGovernance {
        if(next.length < 3 || next.length > 16 || required <= next.length/2 || required > next.length) revert InvalidConfiguration();
        for(uint256 i;i<signerList.length;++i) signer[signerList[i]]=false;
        delete signerList;
        address previous;
        for(uint256 i;i<next.length;++i){
            if(next[i] <= previous) revert InvalidConfiguration();
            signer[next[i]]=true; signerList.push(next[i]); previous=next[i];
        }
        threshold=required; ++signerEpoch;
        emit SignersChanged(signerEpoch,required,next);
    }
    function activate() external onlyGovernance {
        if(remoteBridge == address(0) || threshold == 0) revert InvalidConfiguration();
        enabled=true; emit StatusChanged(enabled,paused,outboundRetired);
    }
    function pause() external {
        if(msg.sender != guardian && msg.sender != governance) revert Unauthorized();
        paused=true; emit StatusChanged(enabled,paused,outboundRetired);
    }
    function resume() external onlyGovernance { paused=false; emit StatusChanged(enabled,paused,outboundRetired); }
    /// @notice Stops new outward migrations permanently; incoming claims remain usable.
    function retireOutbound() external onlyGovernance { outboundRetired=true; emit StatusChanged(enabled,paused,outboundRetired); }
    function liquidity() public view returns(uint256) {
        return asset == address(0) ? address(this).balance : IERC20(asset).balanceOf(address(this));
    }
    function fund(uint256 amount) external payable nonReentrant {
        if(amount == 0) revert InvalidTransfer();
        collect(amount); emit Funded(msg.sender,amount);
    }
    function deposit(address recipient, uint256 amount) external payable nonReentrant returns(uint256) {
        if(!enabled || paused || outboundRetired) revert Unavailable();
        if(recipient == address(0) || recipient == remoteBridge || amount == 0 || amount > perTransferCap) revert InvalidTransfer();
        uint256 day=block.timestamp/1 days;
        if(amount > lifetimeOutboundCap-totalDeposited || amount > dailyCap-dailyDeposited[day]) revert Capacity();
        collect(amount);
        totalDeposited+=amount; dailyDeposited[day]+=amount; ++nonce;
        emit Deposited(nonce,msg.sender,recipient,amount,remoteChain,remoteBridge);
        return nonce;
    }
    function collect(uint256 amount) private {
        if(asset == address(0)) { if(msg.value != amount) revert InvalidTransfer(); }
        else {
            if(msg.value != 0) revert InvalidTransfer();
            uint256 beforeBalance=liquidity();
            IERC20(asset).safeTransferFrom(msg.sender,address(this),amount);
            if(liquidity()-beforeBalance != amount) revert InvalidTransfer();
        }
    }
    function messageId(Transfer calldata t) public pure returns(bytes32) {
        return keccak256(abi.encode(t.sourceChain,t.sourceBridge,t.nonce));
    }
    function transferDigest(Transfer calldata t) public view returns(bytes32) {
        return _hashTypedDataV4(keccak256(abi.encode(TRANSFER_TYPEHASH,t.sourceChain,t.sourceBridge,t.nonce,
            t.sender,t.recipient,t.amount,t.transactionHash,t.logIndex,t.signerEpoch,t.deadline)));
    }
    function release(Transfer calldata t, bytes[] calldata signatures) external nonReentrant {
        if(!enabled || paused) revert Unavailable();
        if(t.sourceChain != remoteChain || t.sourceBridge != remoteBridge || t.nonce == 0 || t.sender == address(0)
            || t.recipient == address(0) || t.recipient == address(this) || t.amount == 0 || t.amount > perTransferCap
            || t.transactionHash == bytes32(0) || t.signerEpoch != signerEpoch || t.deadline < block.timestamp
            || t.deadline > block.timestamp + 7 days) revert InvalidTransfer();
        bytes32 id=messageId(t); if(processed[id]) revert AlreadyProcessed();
        if(signatures.length != threshold) revert InvalidQuorum();
        bytes32 signedDigest=transferDigest(t); address previous;
        for(uint256 i;i<signatures.length;++i){
            address recovered=ECDSA.recover(signedDigest,signatures[i]);
            if(recovered <= previous || !signer[recovered]) revert InvalidQuorum();
            previous=recovered;
        }
        uint256 day=block.timestamp/1 days;
        if(t.amount > lifetimeInboundCap-totalReleased || t.amount > dailyCap-dailyReleased[day] || t.amount > liquidity()) revert Capacity();
        processed[id]=true; totalReleased+=t.amount; dailyReleased[day]+=t.amount;
        if(asset == address(0)) {
            (bool sent,)=payable(t.recipient).call{value:t.amount}(""); if(!sent) revert InvalidTransfer();
        } else IERC20(asset).safeTransfer(t.recipient,t.amount);
        emit Released(id,t.recipient,t.amount,t.transactionHash);
    }
}
