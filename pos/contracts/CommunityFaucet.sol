// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
/// @notice Finite native-LAC community allocation; one claim per address, not per human.
contract CommunityFaucet {
    uint256 public constant AWARD = 100 ether;
    uint256 public constant BUDGET = 100000 ether;
    address public immutable distributor;
    uint256 public distributed;
    mapping(address=>bool) public claimed;
    event Claimed(address indexed recipient, uint256 amount);
    error InvalidClaim();
    constructor(address distributor_) payable {
        if(block.chainid!=20261020 && block.chainid!=31337) revert InvalidClaim();
        if(distributor_==address(0)||msg.value!=BUDGET) revert InvalidClaim();
        distributor=distributor_;
    }
    function claimFor(address payable recipient) external {
        if(msg.sender!=distributor||recipient==address(0)||recipient==address(this)||claimed[recipient]||distributed+AWARD>BUDGET) revert InvalidClaim();
        claimed[recipient]=true;distributed+=AWARD;
        (bool ok,)=recipient.call{value:AWARD}("");if(!ok)revert InvalidClaim();
        emit Claimed(recipient,AWARD);
    }
}
