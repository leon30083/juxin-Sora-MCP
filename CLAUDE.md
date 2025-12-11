# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an MCP (Model Context Protocol) server project that integrates Juxin's Sora-2 API for video generation. The MCP tool enables users to generate videos through a conversational interface, with automatic progress tracking and status reporting.

## Current Project Status

This project is in the planning and documentation phase. The implementation has not yet started.

## Key Requirements

1. **Core Functionality**:
   - Integrate Juxin's Sora-2 API for video generation
   - Track video generation progress and provide status updates
   - Return final video download URLs or error information
   - Support both text-to-video and image-to-video generation

2. **API Details**:
   - Base URL: `https://api.jxincm.cn`
   - Authentication: Bearer token
   - Test API Key: `sk-Q6DwAtsNvutSlaZXYAzXR39pUmwKHAHDgll0QifCL5GbwJd7`
   - Create endpoint: `POST /v1/video/create`
   - Query endpoint: `GET /v1/video/query`

3. **Required Parameters for Video Creation**:
   - `images`: Array of image URLs (empty array for text-only)
   - `model`: "sora-2"
   - `orientation`: "portrait" or "landscape"
   - `prompt`: Text prompt for video generation
   - `size`: "small" (720p) or "large" (1080p)
   - `duration`: 10 seconds (supported value)
   - `watermark`: Boolean (true/false)
   - `private`: Boolean (hide video from public gallery)

## Implementation Plan

The MCP server will need to:

1. **Create Video Tool**:
   - Accept user parameters (prompt, images, orientation, etc.)
   - Call Juxin's `/v1/video/create` endpoint
   - Return task ID for tracking

2. **Query Status Tool**:
   - Poll `/v1/video/query` endpoint with task ID
   - Handle different statuses: pending, processing, completed, failed
   - Return progress updates to user

3. **Error Handling**:
   - Handle API errors gracefully
   - Report failure reasons to users
   - Implement retry logic for transient failures

## Development Commands

Since the project hasn't been implemented yet, no specific commands are available. When implementation begins, typical commands will include:

- Installation: `pip install -e .` (for Python) or `npm install` (for Node.js)
- Testing: `pytest` or `npm test`
- Linting: `flake8` or `eslint`
- Running the MCP server: `python -m juxin_mcp` or `npm start`

## Architecture Considerations

1. **Language Choice**: Use Python with FastMCP or TypeScript with MCP SDK
2. **Async Operations**: Implement async polling for video status
3. **Rate Limiting**: Respect Juxin's API rate limits
4. **Configuration**: Support environment variables for API keys and settings
5. **Logging**: Implement proper logging for debugging and monitoring

## Documentation Structure

- `开发资料夹-用户存放资料/需求对话.md`: Project requirements
- `开发资料夹-用户存放资料/llm.txt`: Complete API documentation index
- `开发资料夹-用户存放资料/聚鑫API文档/`: Detailed API specifications
- `开发资料夹-用户存放资料/聚鑫测试用key.md`: Test credentials

## Next Steps

1. Choose implementation language (Python recommended for FastMCP)
2. Set up basic MCP server structure
3. Implement video creation tool
4. Implement status polling mechanism
5. Add comprehensive error handling
6. Create user documentation and tutorials