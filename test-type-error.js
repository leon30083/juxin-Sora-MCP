#!/usr/bin/env node

// 测试类型错误
const limit = {}; // 这应该是造成错误的原因
const filteredTasks = [1,2,3,4,5];
const tasksToShow = filteredTasks.slice(0, limit); // 这里会出错

console.log(tasksToShow);