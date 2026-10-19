// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
/// @notice An irrevocable, fully funded native-LAC grant. No administrator or clawback.
contract FunD {
    address payable public beneficiary;
    address payable public nominatedBeneficiary;
    uint256 public immutable allocation;
    uint64 public immutable start;
    uint64 public immutable duration;
    uint256 public released;
    bool private entered;
    error InvalidGrant();
    event Released(address indexed beneficiary,uint256 amount);
    event BeneficiaryNominated(address indexed nominee);
    event BeneficiaryChanged(address indexed beneficiary);
    constructor(address payable beneficiary_,uint64 start_,uint64 duration_) payable {
        if(beneficiary_==address(0)||beneficiary_==address(this)||msg.value==0||duration_==0||duration_>3650 days||(start_!=0&&start_<block.timestamp))revert InvalidGrant();
        beneficiary=beneficiary_;allocation=msg.value;start=start_==0?uint64(block.timestamp):start_;duration=duration_;
    }
    function vested() public view returns(uint256){
        if(block.timestamp<=start)return 0;
        uint256 elapsed=block.timestamp-start;
        return elapsed>=duration?allocation:allocation*elapsed/duration;
    }
    function release() external {
        if(entered)revert InvalidGrant();entered=true;
        uint256 amount=vested()-released;if(amount==0)revert InvalidGrant();released+=amount;
        (bool ok,)=beneficiary.call{value:amount}("");if(!ok)revert InvalidGrant();
        emit Released(beneficiary,amount);entered=false;
    }
    function nominate(address payable next) external {
        if(msg.sender!=beneficiary||next==address(0)||next==address(this))revert InvalidGrant();
        nominatedBeneficiary=next;emit BeneficiaryNominated(next);
    }
    function accept() external {
        if(msg.sender!=nominatedBeneficiary)revert InvalidGrant();
        beneficiary=nominatedBeneficiary;nominatedBeneficiary=payable(address(0));emit BeneficiaryChanged(beneficiary);
    }
}
