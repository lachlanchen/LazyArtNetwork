// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/// @notice Prefunded, finite community rewards, supporting EOA and ERC-1271 attestors.
/// @dev Chain/contract-bound receipts, permanent replay protection, delayed attestor rotation.
/// Supports exact-transfer, non-rebasing ERC20 only. No minting or withdrawal authority.
contract CommunityClaimVault is EIP712, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    struct Receipt {
        bytes32 campaignId;
        uint256 attestorEpoch;
        bytes32 claimId;
        address recipient;
        uint256 amount;
        bytes32 evidenceHash;
        uint256 deadline;
    }

    bytes32 public constant RECEIPT_TYPEHASH = keccak256(
        "Receipt(bytes32 campaignId,uint256 attestorEpoch,bytes32 claimId,address recipient,uint256 amount,bytes32 evidenceHash,uint256 deadline)"
    );
    IERC20 public immutable token;
    address public attestor;
    bytes32 public immutable campaignId;
    uint256 public immutable budget;
    uint256 public immutable perClaimMax;
    address public immutable controller;
    uint256 public distributed;
    uint256 public attestorEpoch;
    mapping(bytes32 => bool) public claimed;

    error InvalidConfiguration();
    error ControllerOnly();
    error InvalidReceipt();
    error ReceiptExpired();
    error InvalidSignature();
    error AlreadyClaimed();
    error PerClaimLimitExceeded();
    error CampaignBudgetExceeded();
    error CampaignNotFunded();
    error InexactTransfer();

    event Claimed(bytes32 indexed campaignId, bytes32 indexed claimId,
        address indexed recipient, uint256 amount, bytes32 evidenceHash);

    constructor(IERC20 token_, address attestor_, bytes32 campaignId_, uint256 budget_,
        uint256 perClaimMax_, address controller_)
        EIP712("LazyArt Community Claims", "1")
    {
        if (address(token_).code.length == 0 || attestor_ == address(0) ||
            controller_.code.length == 0 || campaignId_ == bytes32(0) || budget_ == 0 ||
            perClaimMax_ == 0 || perClaimMax_ > budget_) revert InvalidConfiguration();
        token = token_;
        attestor = attestor_;
        campaignId = campaignId_;
        budget = budget_;
        perClaimMax = perClaimMax_;
        controller = controller_;
    }

    event AttestorChanged(address indexed attestor, uint256 epoch);

    function setAttestor(address next) external {
        if (msg.sender != controller) revert ControllerOnly();
        if (next == address(0)) revert InvalidConfiguration();
        attestor = next; ++attestorEpoch; emit AttestorChanged(next, attestorEpoch);
    }

    function pause() external {
        if (msg.sender != controller) revert ControllerOnly();
        _pause();
    }

    function unpause() external {
        if (msg.sender != controller) revert ControllerOnly();
        _unpause();
    }

    /// @notice Anyone may relay; only the signed recipient can receive the signed amount.
    function claim(Receipt calldata receipt, bytes calldata signature) external nonReentrant whenNotPaused {
        if (receipt.campaignId != campaignId || receipt.attestorEpoch != attestorEpoch || receipt.claimId == bytes32(0) ||
            receipt.recipient == address(0) || receipt.recipient == address(this) ||
            receipt.evidenceHash == bytes32(0) || receipt.amount == 0) revert InvalidReceipt();
        if (block.timestamp > receipt.deadline) revert ReceiptExpired();
        if (claimed[receipt.claimId]) revert AlreadyClaimed();
        if (receipt.amount > perClaimMax) revert PerClaimLimitExceeded();
        if (receipt.amount > budget - distributed) revert CampaignBudgetExceeded();
        bytes32 digest = _hashTypedDataV4(keccak256(abi.encode(RECEIPT_TYPEHASH,
            receipt.campaignId, receipt.attestorEpoch, receipt.claimId, receipt.recipient, receipt.amount,
            receipt.evidenceHash, receipt.deadline)));
        if (!SignatureChecker.isValidSignatureNow(attestor, digest, signature)) revert InvalidSignature();
        if (token.balanceOf(address(this)) < budget - distributed) revert CampaignNotFunded();
        uint256 recipientBefore = token.balanceOf(receipt.recipient);
        claimed[receipt.claimId] = true;
        distributed += receipt.amount;
        token.safeTransfer(receipt.recipient, receipt.amount);
        if (token.balanceOf(receipt.recipient) != recipientBefore + receipt.amount ||
            token.balanceOf(address(this)) < budget - distributed) revert InexactTransfer();
        emit Claimed(campaignId, receipt.claimId, receipt.recipient, receipt.amount, receipt.evidenceHash);
    }
}
