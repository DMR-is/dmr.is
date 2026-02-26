// @ts-check

/** @type {import('@yarnpkg/types')} */
const { defineConfig } = require('@yarnpkg/types')

/**
 * Rule 1: Same-version enforcement.
 * If two workspaces declare the same dependency (excluding peerDependencies),
 * their version ranges must match.
 */
function enforceConsistentVersions({ Yarn }) {
  for (const dependency of Yarn.dependencies()) {
    if (dependency.type === 'peerDependencies') continue

    for (const otherDependency of Yarn.dependencies({
      ident: dependency.ident,
    })) {
      if (otherDependency.type === 'peerDependencies') continue
      if (dependency.range !== otherDependency.range) {
        dependency.update(otherDependency.range)
      }
    }
  }
}

/**
 * Rule 2: @dmr.is/* workspace dependencies must always use '*' version.
 * Only applies to packages that are actual workspaces (not external npm packages
 * like @dmr.is/regulations-tools).
 */
function enforceWorkspaceStar({ Yarn }) {
  const workspaceIdents = new Set(
    Yarn.workspaces().map((ws) => ws.ident),
  )

  for (const dependency of Yarn.dependencies()) {
    if (
      dependency.ident.startsWith('@dmr.is/') &&
      workspaceIdents.has(dependency.ident) &&
      dependency.range !== '*'
    ) {
      dependency.update('*')
    }
  }
}

/**
 * Rule 3: Apps must not have peerDependencies.
 */
function forbidAppPeerDependencies({ Yarn }) {
  for (const workspace of Yarn.workspaces()) {
    if (!workspace.cwd.startsWith('apps/')) continue

    for (const dependency of Yarn.dependencies({ workspace })) {
      if (dependency.type === 'peerDependencies') {
        dependency.error('Apps must not declare peerDependencies')
      }
    }
  }
}

/**
 * Rule 4: Libs must not have framework packages in dependencies (should be peerDependencies).
 */
const FRAMEWORK_PACKAGES = new Set([
  'react',
  'react-dom',
  'next',
  'next-auth',
  '@nestjs/common',
  '@nestjs/core',
  '@nestjs/config',
  '@nestjs/swagger',
  '@nestjs/sequelize',
  '@nestjs/cache-manager',
  '@nestjs/schedule',
  '@nestjs/platform-express',
  'sequelize',
  'sequelize-typescript',
  'winston',
  'nest-winston',
  'rxjs',
  '@tanstack/react-query',
  '@trpc/server',
  '@trpc/react-query',
  '@vanilla-extract/css',
  '@vanilla-extract/recipes',
])

function enforceLibFrameworkPeers({ Yarn }) {
  for (const workspace of Yarn.workspaces()) {
    if (!workspace.cwd.startsWith('libs/')) continue

    for (const dependency of Yarn.dependencies({ workspace })) {
      if (
        dependency.type === 'dependencies' &&
        FRAMEWORK_PACKAGES.has(dependency.ident)
      ) {
        dependency.error(
          `Framework package "${dependency.ident}" must be in peerDependencies, not dependencies, for libs`,
        )
      }
    }
  }
}

/**
 * Rule 5: @types/* must be in devDependencies, never in dependencies.
 */
function enforceTypesInDevDeps({ Yarn }) {
  for (const dependency of Yarn.dependencies()) {
    if (
      dependency.ident.startsWith('@types/') &&
      dependency.type === 'dependencies'
    ) {
      dependency.error(
        `@types/* package "${dependency.ident}" must be in devDependencies, not dependencies`,
      )
    }
  }
}

module.exports = defineConfig({
  async constraints(ctx) {
    enforceConsistentVersions(ctx)
    enforceWorkspaceStar(ctx)
    forbidAppPeerDependencies(ctx)
    enforceLibFrameworkPeers(ctx)
    enforceTypesInDevDeps(ctx)
  },
})
