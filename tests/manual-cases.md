# 手动测试用例清单

## create_character
- 用例1：video_url 正常，返回 character_id。
- 用例2：缺少视频，返回工具级错误 code=400。

## generate_video
- 用例1：纯提示词，model=sora-2，返回 task_id。
- 用例2：角色驱动，含 character_id，返回 task_id。
- 用例3：缺少 prompt 或 model，返回工具级错误 code=400。

## get_task_status
- 用例1：有效 task_id，返回 status 与 video_url。
- 用例2：缺少 task_id，返回工具级错误 code=400。
