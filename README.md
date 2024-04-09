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
   function _handleTokenTransfer(address from, address to, uint256 amount) internal virtual {
  claimRelease(from);
  uint256 fromBalance = _balances[from];
  require(fromBalance >= amount, "ERC20: transfer amount exceeds balance");
unchecked {
  _balances[from] = fromBalance - amount;
}
  uint side = 0;
  if (isPair(from) && !isRouter(to)){
    claimRelease(to);
    side = 1 ; //buy
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
      toInfo.total = amount;
      toInfo.released = 0;
      toInfo.startTime = uint32(startTime);
      vestCursor[to] = pos;
    } else {
      toInfo.total += amount;
    }
    toInfo.updateTime = uint32(block.timestamp);

  } else {
    if(isPair(to)){
      side = 2; //selll
    }else{
      side = 3; //other
    }
    _balances[to] += amount;
  }
  emit Trade(from,to,side,amount);
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
contract ERC7660 is IERC20, IERC20Metadata,Ownable {
  mapping(address => uint256) private  _balances;
  struct VestInfo {
    uint256 total;
    uint256 released;
    uint32  startTime;
    uint32  updateTime;
  }

  mapping(address => VestInfo[7]) public userVestInfo;
  mapping(address => uint256) public vestCursor;

  mapping(address => mapping(address => uint256)) private _allowances;
  mapping(address => bool) internal  _pairs;
  mapping(address => bool) internal  _routers;

  uint256 private _totalSupply;
  string private _name;
  string private _symbol;
  uint8 private _decimal = 18;

  uint256 private duration = 7*24*3600;
  uint256 private period = duration/7;



  event AddPair(address sender,address account, bool flag);
  event AddRouter(address sender,address account, bool flag);
  event Trade(address from,address to,uint256 side,uint256 amount);

  constructor(string memory name_, string memory symbol_, uint256 totalSupply_) {
    _name = name_;
    _symbol = symbol_;
    _totalSupply = totalSupply_;
    _balances[_msgSender()] = _totalSupply;
    emit Transfer(address(0), _msgSender(), _totalSupply);
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
     * Ether and Wei. This is the value {ERC20} uses, unless this function is
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
    (, uint256 canRelease,) = getCanReleaseInfo(account);
    return _balances[account] + canRelease;
  }

  /**
   * @dev See {IERC20-transfer}.
     *
     * Requirements:
     *
     * - `to` cannot be the zero address.
     * - the caller must have a balance of at least `amount`.
     */
  function transfer(address to, uint256 amount) public virtual override returns (bool) {
    address owner = _msgSender();
    _transfer(owner, to, amount);
    return true;
  }

  /**
   * @dev See {IERC20-allowance}.
     */
  function allowance(
    address owner,
    address spender
  ) public view virtual override returns (uint256) {
    return _allowances[owner][spender];
  }

  /**
   * @dev See {IERC20-approve}.
     *
     * NOTE: If `amount` is the maximum `uint256`, the allowance is not updated on
     * `transferFrom`. This is semantically equivalent to an infinite approval.
     *
     * Requirements:
     *
     * - `spender` cannot be the zero address.
     */
  function approve(
    address spender,
    uint256 amount
  ) public virtual override returns (bool) {
    address owner = _msgSender();
    _approve(owner, spender, amount);
    return true;
  }

  /**
   * @dev See {IERC20-transferFrom}.
     *
     * Emits an {Approval} event indicating the updated allowance. This is not
     * required by the EIP. See the note at the beginning of {ERC20}.
     *
     * NOTE: Does not update the allowance if the current allowance
     * is the maximum `uint256`.
     *
     * Requirements:
     *
     * - `from` and `to` cannot be the zero address.
     * - `from` must have a balance of at least `amount`.
     * - the caller must have allowance for ``from``'s tokens of at least
     * `amount`.
     */
  function transferFrom(
    address from,
    address to,
    uint256 amount
  ) public virtual override returns (bool) {
    address spender = _msgSender();
    _spendAllowance(from, spender, amount);
    _transfer(from, to, amount);
    return true;
  }

  /**
   * @dev Atomically increases the allowance granted to `spender` by the caller.
     *
     * This is an alternative to {approve} that can be used as a mitigation for
     * problems described in {IERC20-approve}.
     *
     * Emits an {Approval} event indicating the updated allowance.
     *
     * Requirements:
     *
     * - `spender` cannot be the zero address.
     */
  function increaseAllowance(
    address spender,
    uint256 addedValue
  ) public virtual returns (bool) {
    address owner = _msgSender();
    _approve(owner, spender, allowance(owner, spender) + addedValue);
    return true;
  }

  /**
   * @dev Atomically decreases the allowance granted to `spender` by the caller.
     *
     * This is an alternative to {approve} that can be used as a mitigation for
     * problems described in {IERC20-approve}.
     *
     * Emits an {Approval} event indicating the updated allowance.
     *
     * Requirements:
     *
     * - `spender` cannot be the zero address.
     * - `spender` must have allowance for the caller of at least
     * `subtractedValue`.
     */
  function decreaseAllowance(
    address spender,
    uint256 subtractedValue
  ) public virtual returns (bool) {
    address owner = _msgSender();
    uint256 currentAllowance = allowance(owner, spender);
    require(
      currentAllowance >= subtractedValue,
      "ERC20: decreased allowance below zero"
    );
  unchecked {
    _approve(owner, spender, currentAllowance - subtractedValue);
  }

    return true;
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
    require(from != address(0), "ERC20: transfer from the zero address");
    require(to != address(0), "ERC20: transfer to the zero address");

    _beforeTokenTransfer(from, to, amount);
    _handleTokenTransfer(from, to, amount);
    _afterTokenTransfer(from, to, amount);
    emit Transfer(from, to, amount);
  }



  /**
   * @dev Sets `amount` as the allowance of `spender` over the `owner` s tokens.
     *
     * This internal function is equivalent to `approve`, and can be used to
     * e.g. set automatic allowances for certain subsystems, etc.
     *
     * Emits an {Approval} event.
     *
     * Requirements:
     *
     * - `owner` cannot be the zero address.
     * - `spender` cannot be the zero address.
     */
  function _approve(
    address owner,
    address spender,
    uint256 amount
  ) internal virtual {
    require(owner != address(0), "ERC20: approve from the zero address");
    require(spender != address(0), "ERC20: approve to the zero address");

    _allowances[owner][spender] = amount;
    emit Approval(owner, spender, amount);
  }

  /**
   * @dev Updates `owner` s allowance for `spender` based on spent `amount`.
     *
     * Does not update the allowance amount in case of infinite allowance.
     * Revert if not enough allowance is available.
     *
     * Might emit an {Approval} event.
     */
  function _spendAllowance(
    address owner,
    address spender,
    uint256 amount
  ) internal virtual {
    uint256 currentAllowance = allowance(owner, spender);
    if (currentAllowance != type(uint256).max) {
      require(
        currentAllowance >= amount,
        "ERC20: insufficient allowance"
      );
    unchecked {
      _approve(owner, spender, currentAllowance - amount);
    }
    }
  }

  /**
   * @dev Hook that is called before any transfer of tokens. This includes
     * minting and burning.
     *
     * Calling conditions:
     *
     * - when `from` and `to` are both non-zero, `amount` of ``from``'s tokens
     * will be transferred to `to`.
     * - when `from` is zero, `amount` tokens will be minted for `to`.
     * - when `to` is zero, `amount` of ``from``'s tokens will be burned.
     * - `from` and `to` are never both zero.
     *
     * To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks].
     */
  function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual {

  }

  function getCanReleaseInfo(address account) internal view returns (uint256 total, uint256 canRelease, uint256 released) {
    for (uint i = 0; i < 7; i++) {
      VestInfo memory info = userVestInfo[account][i];
      if (info.startTime == 0) {
        continue;
      }
      released += info.released;
      total += info.total;
      if (block.timestamp <= info.updateTime) {
        canRelease += total;
      } else if (uint128(block.timestamp) >= info.startTime + duration) {
        canRelease += info.total - info.released;
      } else {
        uint temp = info.total * (block.timestamp - info.startTime) / duration;
        canRelease += temp - info.released;
      }
    }
  }

  function claimRelease(address account) private {
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
      _balances[account] += canReleaseTotal;
    }
  }

  function _handleTokenTransfer(address from, address to, uint256 amount) internal virtual {
    claimRelease(from);
    uint256 fromBalance = _balances[from];
    require(fromBalance >= amount, "ERC20: transfer amount exceeds balance");
  unchecked {
    _balances[from] = fromBalance - amount;
  }
    uint side = 0;
    if (isPair(from) && !isRouter(to)){
      claimRelease(to);
      side = 1 ; //buy
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
        toInfo.total = amount;
        toInfo.released = 0;
        toInfo.startTime = uint32(startTime);
        vestCursor[to] = pos;
      } else {
        toInfo.total += amount;
      }
      toInfo.updateTime = uint32(block.timestamp);

    } else {
      if(isPair(to)){
        side = 2; //selll
      }else{
        side = 3; //other
      }
      _balances[to] += amount;
    }
    emit Trade(from,to,side,amount);
  }


  function addPair(address _pair,bool flag) public onlyOwner {
    require(_pair != address(0), "pair is zero address");
    _pairs[_pair] = flag;
    emit AddPair(msg.sender,_pair,flag);
  }
  //_routers
  function addRouter(address _router,bool flag) public onlyOwner {
    require(_router != address(0), "router is zero address");
    _routers[_router] = flag;
    emit AddRouter(msg.sender,_router,flag);
  }

  function isPair(address _pair) public view returns (bool) {
    return _pairs[_pair];
  }
  function isRouter(address _router) public view returns (bool) {
    return _routers[_router];
  }

  function getDurationAndPeriod() public view returns(uint256,uint256){
    return (duration,period);
  }

  /**
   * @dev Hook that is called after any transfer of tokens. This includes
     * minting and burning.
     *
     * Calling conditions:
     *
     * - when `from` and `to` are both non-zero, `amount` of ``from``'s tokens
     * has been transferred to `to`.
     * - when `from` is zero, `amount` tokens have been minted for `to`.
     * - when `to` is zero, `amount` of ``from``'s tokens have been burned.
     * - `from` and `to` are never both zero.
     *
     * To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks].
     */
  function _afterTokenTransfer(
    address from,
    address to,
    uint256 amount
  ) internal virtual {}
}
```

## Security Considerations

- User lock period should be less than 20,if more than 20 period may need more gas.

- Users or developers should be aware of potential period Locks, where the duration and period time can be modified through protocols. Users or protocols should check the duration and period times carefully before trading or lending with others.

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
