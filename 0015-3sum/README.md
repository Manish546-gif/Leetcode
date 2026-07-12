# 15. 3Sum

**Difficulty:** Medium  
**Topics:** Array, Two Pointers, Sorting

## Problem Statement

Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, and j != k, and nums[i] + nums[j] + nums[k] == 0.

Notice that the solution set must not contain duplicate triplets.

## Examples

**Input:** nums = [-1,0,1,2,-1,-4]
**Output:** [[-1,-1,2],[-1,0,1]]

**Input:** nums = [0,1,1]
**Output:** []

**Input:** nums = [0,0,0]
**Output:** [[0,0,0]]

## Constraints

- 3 <= nums.length <= 3000
- -10^5 <= nums[i] <= 10^5
