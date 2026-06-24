import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { WorkspaceService } from './workspace.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CreateProjectDto,
  UpdateProjectDto,
  CreateWorkspaceDto,
} from './dto/workspace.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class WorkspaceController {
  constructor(private workspaceService: WorkspaceService) {}

  @Get('organizations/:orgId/workspaces')
  listWorkspaces(@Req() req: Request, @Param('orgId') orgId: string) {
    return this.workspaceService.listWorkspaces(
      (req.user as { id: string }).id,
      orgId,
    );
  }

  @Post('organizations/:orgId/workspaces')
  createWorkspace(
    @Req() req: Request,
    @Param('orgId') orgId: string,
    @Body() dto: CreateWorkspaceDto,
  ) {
    return this.workspaceService.createWorkspace(
      (req.user as { id: string }).id,
      orgId,
      dto,
    );
  }

  @Get('workspaces/:workspaceId/projects')
  listProjects(@Req() req: Request, @Param('workspaceId') workspaceId: string) {
    return this.workspaceService.listProjects(
      (req.user as { id: string }).id,
      workspaceId,
    );
  }

  @Post('workspaces/:workspaceId/projects')
  createProject(
    @Req() req: Request,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateProjectDto,
  ) {
    return this.workspaceService.createProject(
      (req.user as { id: string }).id,
      workspaceId,
      dto,
    );
  }

  @Get('projects/:projectId')
  getProject(@Req() req: Request, @Param('projectId') projectId: string) {
    return this.workspaceService.getProject(
      (req.user as { id: string }).id,
      projectId,
    );
  }

  @Patch('projects/:projectId')
  updateProject(
    @Req() req: Request,
    @Param('projectId') projectId: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.workspaceService.updateProject(
      (req.user as { id: string }).id,
      projectId,
      dto,
    );
  }

  @Delete('projects/:projectId')
  deleteProject(@Req() req: Request, @Param('projectId') projectId: string) {
    return this.workspaceService.deleteProject(
      (req.user as { id: string }).id,
      projectId,
    );
  }
}
