import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { OrgRole } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { slugify } from '../../../common/utils/slug';
import {
  CreateProjectDto,
  UpdateProjectDto,
  CreateWorkspaceDto,
} from './dto/workspace.dto';

@Injectable()
export class WorkspaceService {
  constructor(private prisma: PrismaService) {}

  async listWorkspaces(userId: string, organizationId: string) {
    await this.assertMember(userId, organizationId, [
      OrgRole.OWNER,
      OrgRole.MEMBER,
      OrgRole.VIEWER,
    ]);

    return this.prisma.workspace.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createWorkspace(
    userId: string,
    organizationId: string,
    dto: CreateWorkspaceDto,
  ) {
    await this.assertMember(userId, organizationId, [
      OrgRole.OWNER,
      OrgRole.MEMBER,
    ]);

    const slug = await this.uniqueWorkspaceSlug(organizationId, slugify(dto.name));

    return this.prisma.workspace.create({
      data: {
        organizationId,
        name: dto.name,
        slug,
      },
    });
  }

  async listProjects(userId: string, workspaceId: string) {
    const workspace = await this.getWorkspaceWithAccess(userId, workspaceId, [
      OrgRole.OWNER,
      OrgRole.MEMBER,
      OrgRole.VIEWER,
    ]);

    return this.prisma.project.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async createProject(
    userId: string,
    workspaceId: string,
    dto: CreateProjectDto,
  ) {
    const workspace = await this.getWorkspaceWithAccess(userId, workspaceId, [
      OrgRole.OWNER,
      OrgRole.MEMBER,
    ]);

    return this.prisma.project.create({
      data: {
        workspaceId: workspace.id,
        name: dto.name,
        description: dto.description ?? null,
      },
    });
  }

  async getProject(userId: string, projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { workspace: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    await this.assertMember(userId, project.workspace.organizationId, [
      OrgRole.OWNER,
      OrgRole.MEMBER,
      OrgRole.VIEWER,
    ]);

    return project;
  }

  async updateProject(
    userId: string,
    projectId: string,
    dto: UpdateProjectDto,
  ) {
    const project = await this.getProject(userId, projectId);
    await this.assertMember(userId, project.workspace.organizationId, [
      OrgRole.OWNER,
      OrgRole.MEMBER,
    ]);

    return this.prisma.project.update({
      where: { id: projectId },
      data: {
        name: dto.name ?? project.name,
        description:
          dto.description !== undefined ? dto.description : project.description,
      },
    });
  }

  async deleteProject(userId: string, projectId: string) {
    const project = await this.getProject(userId, projectId);
    await this.assertMember(userId, project.workspace.organizationId, [
      OrgRole.OWNER,
      OrgRole.MEMBER,
    ]);

    await this.prisma.project.delete({ where: { id: projectId } });
    return { deleted: true };
  }

  private async getWorkspaceWithAccess(
    userId: string,
    workspaceId: string,
    roles: OrgRole[],
  ) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    await this.assertMember(userId, workspace.organizationId, roles);
    return workspace;
  }

  private async assertMember(
    userId: string,
    organizationId: string,
    roles: OrgRole[],
  ) {
    const membership = await this.prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: { userId, organizationId },
      },
    });

    if (!membership || !roles.includes(membership.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return membership;
  }

  private async uniqueWorkspaceSlug(
    organizationId: string,
    base: string,
  ): Promise<string> {
    let slug = base || 'workspace';
    let suffix = 0;
    while (true) {
      const candidate = suffix === 0 ? slug : `${slug}-${suffix}`;
      const exists = await this.prisma.workspace.findUnique({
        where: {
          organizationId_slug: { organizationId, slug: candidate },
        },
      });
      if (!exists) return candidate;
      suffix += 1;
    }
  }
}
