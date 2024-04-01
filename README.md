---
eip: 7660
title: Release tokens on predefined periods
description: Controlled by smart contracts, tokens can be linearly released based on the predefined period.
author: Ali Kaya (@AliKaya) <ali.kayatur747@gmail.com>
discussions-to: https://ethereum-magicians.org/t/erc-7660-a-protocol-for-erc20-tokens-which-released-based-on-predefined-periods-controlled/19305
status: Draft
type: Standards Track
category: ERC
created: 2024-03-08
requires: 20
---

## Abstract

This proposal outlines [ERC-20](./eip-20.md) tokens which released based on predefined periods controlled by smart contracts,smart contract allows token released based on predefined periods, enabling lock token balances and gradually release tokens.

## Motivation
The motivation behind this protocol is to enrich the ERC repository. By allowing [ERC-20](./eip-20.md) tokens to have custom linear release schedules, lock-up mechanisms, and whitelisting, this protocol can find applications in scenarios such as MEME tokens, games, DAO organizations, and options trading.

## Specification

This protocol introduces improvements in the following areas:

1. [ERC-20](./eip-20.md) Tokens and Linear Release Functionality.
2. Online Representation of [ERC-20](./eip-20.md)  Balances.
3. Lock-Up Functionality for [ERC-20](./eip-20.md) Tokens.
4. "Sorter" Algorithm.
5. Low-Cost Swap Algorithm.

## Rationale

There are four major improvements in this protocol:

- [ERC-20](./eip-20.md) Tokens and Linear Release Functionality:

  canReleaseAmount = total * (currentTimestamp - startTime) / duration;


- Balance is changed by time:
```solidity
  function balanceOf(address account) public view virtual override returns (uint256) {
 (, uint256 canReleaseAmount, ) = getCanReleaseInfo(account,true);
 return _Owned[account] + canReleaseAmount;
}

 function getCanReleaseInfo(address account) public view returns (uint256 total, uint256 canRelease, uint256 released) {
  for (uint i = 0; i < 7; i++) {
   VestInfo memory info = userVestInfo[account][i];
   if (info.startTime == 0) {
    continue;
   }
   released += info.released;
   total += info.total;
   if (block.timestamp <= info.updateTime) {
    canRelease += total; //Just for swap
   } else if (uint128(block.timestamp) >= info.startTime + duration) {
    canRelease += info.total - info.released;
   } else {
    uint temp = info.total * (block.timestamp - info.startTime) / duration;
    canRelease += temp - info.released;
   }
  }
 }

```
- Sorter && Low-cost swap Algorithm:
```solidity
    function _handleTokenTransfer(address from, address to, uint256 amount,uint256 toAmount) internal virtual {
 claimRelease(from);
 uint256 fromBalance = _Owned[from];
 require(fromBalance >= amount, "ERC-20: transfer amount exceeds balance");
unchecked {
 _Owned[from] = fromBalance - amount;
}
 //update to vestInfo
 if (!_isExcludedVest[to]) {
  claimRelease(to);
  uint startTime = block.timestamp / period * period;
  uint pos = vestCursor[to];
  VestInfo storage toInfo = userVestInfo[to][pos];
  if (toInfo.startTime != startTime) {
   if (pos == 6) {
    pos = 0;
   } else {
    ++pos;
   }
   toInfo = userVestInfo[to][pos];
   toInfo.total = toAmount;
   toInfo.released = 0;
   toInfo.startTime = uint128(startTime);
   vestCursor[to] = pos;
  } else {
   toInfo.total += toAmount;
  }
  toInfo.updateTime = uint128(block.timestamp);
 } else {
  if(_isSwapRouter[to]){
   _Owned[to] += amount;
  }else{
   _Owned[to] += toAmount;
  }
 }
}

 function claimRelease(address account) public {
  uint canReleaseTotal;
  for (uint i = 0; i < 7; i++) {
   VestInfo storage info = userVestInfo[account][i];
   if (info.startTime == 0 || block.timestamp <= info.startTime || info.total == info.released) {
    continue;
   }
   uint canRelease;
   if (uint128(block.timestamp) >= info.startTime + duration) {
    canRelease = info.total - info.released;
   } else {
    uint temp = info.total * (block.timestamp - info.startTime) / duration;
    canRelease = temp - info.released;
   }
   canReleaseTotal += canRelease;
   info.released += canRelease;
  }

  if (canReleaseTotal > 0) {
   _Owned[account] += canReleaseTotal;
  }
 }
```

## Reference Implementation

```solidity
contract ERC9660 is Context,IERC20, IERC20Metadata,Ownable {
 mapping(address => uint256) private  _Owned;
 struct VestInfo {
  uint256 total;
  uint256 released;
  uint256 startTime;
 }
 mapping(address => VestInfo[7]) public userVestInfo; //7 period


 mapping(address => mapping(address => uint256)) private _allowances;
 mapping (address => bool) private _isExcludedVest;
 mapping(address => bool) private _isSwapRouter;

 uint256 private _totalSupply = 1_000_000_000*(10**18);

 string private _name;
 string private _symbol;
 uint8 private _decimal = 18;
 uint256 public duration = 7* 60 * 60; //test for 7 hour release
 uint256 public period = duration/7;
 event SetExcludedVest(address sender,bool flag);
 event SetSwapRouter(address sender,address swapRouter, bool flag);

 /**
  * @dev Sets the values for {name} and {symbol}.
     *
     * The default value of {decimals} is 18. To select a different value for
     * {decimals} you should overload it.
     *
     * All two of these values are immutable: they can only be set once during
     * construction.
     */
 constructor(string memory name_, string memory symbol_) {
  _name = name_;
  _symbol = symbol_;
  _Owned[_msgSender()] = _totalSupply;
  _isExcludedVest[owner()] = true;
  _isExcludedVest[address(this)] = true;

  emit Transfer(address(0), _msgSender(), _totalSupply);
 }

 function setExcludedVest(address account,bool flag) public onlyOwner {
  _isExcludedVest[account] = flag;
  emit SetExcludedVest(msg.sender,flag);
 }

 function setSwapRouter(address _swapRouter, bool flag) public onlyOwner {
  _isSwapRouter[_swapRouter] = flag;
  emit SetSwapRouter(msg.sender,_swapRouter, flag);
 }
 /**
  * @dev Returns the name of the token.
     */
 function name() public view virtual override returns (string memory) {
  return _name;
 }

 /**
  * @dev Returns the symbol of the token, usually a shorter version of the
     * name.
     */
 function symbol() public view virtual override returns (string memory) {
  return _symbol;
 }

 /**
  * @dev Returns the number of decimals used to get its user representation.
     * For example, if `decimals` equals `2`, a balance of `505` tokens should
     * be displayed to a user as `5.05` (`505 / 10 ** 2`).
     *
     * Tokens usually opt for a value of 18, imitating the relationship between
     * Ether and Wei. This is the value {ERC-20} uses, unless this function is
     * overridden;
     *
     * NOTE: This information is only used for _display_ purposes: it in
     * no way affects any of the arithmetic of the contract, including
     * {IERC20-balanceOf} and {IERC20-transfer}.
     */
 function decimals() public view virtual override returns (uint8) {
  return _decimal;
 }

 /**
  * @dev See {IERC20-totalSupply}.
     */
 function totalSupply() public view virtual override returns (uint256) {
  return _totalSupply;
 }

 /**
  * @dev See {IERC20-balanceOf}.
     */
 function balanceOf(address account) public view virtual override returns (uint256) {
  (, uint256 canRelease, ) = getCanReleaseInfo(account,true);
  return _Owned[account] + canRelease;
 }

 function getCanReleaseInfo(address account) public view returns (uint256 total, uint256 canRelease, uint256 released) {
  for (uint i = 0; i < 7; i++) {
   VestInfo memory info = userVestInfo[account][i];
   if (info.startTime == 0) {
    continue;
   }
   released += info.released;
   total += info.total;
   if (block.timestamp <= info.updateTime) {
    canRelease += (total*100/userRation);
   } else if (uint128(block.timestamp) >= info.startTime + duration) {
    canRelease += info.total - info.released;
   } else {
    uint temp = info.total * (block.timestamp - info.startTime) / duration;
    canRelease += temp - info.released;
   }
  }
 }


 /**
  * @dev Moves `amount` of tokens from `from` to `to`.
     *
     * This internal function is equivalent to {transfer}, and can be used to
     * e.g. implement automatic token fees, slashing mechanisms, etc.
     *
     * Emits a {Transfer} event.
     *
     * Requirements:
     *
     * - `from` cannot be the zero address.
     * - `to` cannot be the zero address.
     * - `from` must have a balance of at least `amount`.
     */
 function _transfer(address from, address to, uint256 amount) internal virtual {
  require(from != address(0), "ERC-20: transfer from the zero address");
  require(to != address(0), "ERC-20: transfer to the zero address");

  _beforeTokenTransfer(from, to, amount);
  _handleTokenTransfer(from, to, amount);
  emit Transfer(from, to, amount);
  _afterTokenTransfer(from, to, amount);
 }

 function _handleTokenTransfer(address from, address to, uint256 amount,uint256 toAmount) internal virtual {
  claimRelease(from);
  uint256 fromBalance = _Owned[from];
  require(fromBalance >= amount, "ERC-20: transfer amount exceeds balance");
 unchecked {
  _Owned[from] = fromBalance - amount;
 }
  //update to vestInfo
  if (!_isExcludedVest[to]) {
   claimRelease(to);
   uint startTime = block.timestamp / period * period;
   uint pos = vestCursor[to];
   VestInfo storage toInfo = userVestInfo[to][pos];
   if (toInfo.startTime != startTime) {
    if (pos == 6) {
     pos = 0;
    } else {
     ++pos;
    }
    toInfo = userVestInfo[to][pos];
    toInfo.total = toAmount;
    toInfo.released = 0;
    toInfo.startTime = uint128(startTime);
    vestCursor[to] = pos;
   } else {
    toInfo.total += toAmount;
   }
   toInfo.updateTime = uint128(block.timestamp);
  } else {
   if(_isSwapRouter[to]){
    _Owned[to] += amount;
   }else{
    _Owned[to] += toAmount;
   }
  }
 }

 function claimRelease(address account) public {
  uint canReleaseTotal;
  for (uint i = 0; i < 7; i++) {
   VestInfo storage info = userVestInfo[account][i];
   if (info.startTime == 0 || block.timestamp <= info.startTime || info.total == info.released) {
    continue;
   }
   uint canRelease;
   if (uint128(block.timestamp) >= info.startTime + duration) {
    canRelease = info.total - info.released;
   } else {
    uint temp = info.total * (block.timestamp - info.startTime) / duration;
    canRelease = temp - info.released;
   }
   canReleaseTotal += canRelease;
   info.released += canRelease;
  }

  if (canReleaseTotal > 0) {
   _Owned[account] += canReleaseTotal;
  }
 }



}

```

## Security Considerations

- User lock period should be less than 20,if more than 20 period may need more gas.

- Users or developers should be aware of potential period Locks, where the duration and period time can be modified through protocols. Users or protocols should check the duration and period times carefully before trading or lending with others.

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
