'use strict'
const kennitala = require('kennitala')
const fakeNationalIdPrefixes = ['010130', /(\d+)\1{6,}/]

module.exports = {
  'require-reduce-defaults': {
    meta: {
      type: 'problem',
      docs: {
        description: 'require a default value when using .reduce()',
        category: 'Possible Errors',
        recommended: true,
      },
      schema: [],
    },
    create: function (context) {
      return {
        "CallExpression[arguments.length=1] > MemberExpression.callee > Identifier.property[name='reduce']":
          (node) => {
            context.report({
              node,
              message: 'Provide initialValue to .reduce().',
            })
          },
      }
    },
  },
  'disallow-kennitalas': {
    meta: {
      docs: {
        description: 'disallow kennitalas',
        category: 'Possible Errors',
        recommended: true,
      },
      schema: [],
    },
    create: function (context) {
      function checkKennitala(value, node) {
        if (
          kennitala.isValid(value) &&
          !fakeNationalIdPrefixes.some(
            (nID) => new String(value).search(nID) >= 0,
          )
        ) {
          context.report({
            node: node,
            message: `Found valid SSN: ${value}`,
          })
        }
      }
      return {
        Literal(node) {
          const { value } = node
          checkKennitala(value, node)
        },
        TemplateElement(node) {
          if (!node.value) return
          const value = node.value.cooked
          checkKennitala(value, node)
        },
      }
    },
  },
  'no-async-module-init': {
    meta: {
      type: 'problem',
      docs: {
        description: 'disallow async module initialisation',
        category: 'Possible Errors',
        recommended: true,
      },
      messages: {
        noAsyncRegister:
          'Disallowing static async {{ name }} function in modules to prevent unexpected startup failures or timeouts.',
        noAsyncProviderFactory:
          'Disallowing async useFactory in module providers to prevent unexpected startup failures or timeouts.',
        noReturnPromiseDynamicModule:
          'Disallowing static async functions with returnType Promise<DynamicModule> in modules to prevent unexpected startup failures or timeouts.',
      },
    },
    schema: [],
    create: function (context) {
      const nameSymbols = [
        'register',
        'forRoot',
        'forRootAsync',
        'forFeature',
        'forFeatureAsync',
      ]

      const rules = {
        ...nameSymbols.reduce((rules, name) => {
          return {
            ...rules,
            [`MethodDefinition[static=true][key.name='${name}'][value.async=true]`]:
              (node) => {
                context.report({
                  node,
                  messageId: 'noAsyncRegister',
                  data: {
                    name,
                  },
                })
              },
          }
        }, {}),
        "MethodDefinition[static=true] TSTypeReference[typeName.name='Promise'] TSTypeReference[typeName.name='DynamicModule']":
          (node) => {
            context.report({
              node,
              messageId: 'noReturnPromiseDynamicModule',
            })
          },
        "Property[key.name='useFactory'][value.async=true]": (node) => {
          context.report({
            node,
            messageId: 'noAsyncProviderFactory',
          })
        },
      }

      return rules
    },
  },
  /**
   * This rule is used to enforce the use of CacheField decorator or explicit cache control on all fields that resolve
   * to an object. Otherwise, these fields may disable caching for the whole response:
   *
   * https://www.apollographql.com/docs/apollo-server/performance/caching/#calculating-cache-behavior
   *
   * This is mainly relevant for the CMS domain, where we use persistent cached GET queries and Apollo response caching.
   *
   * Generally, each root resolver should specify a maxAge based on the frequency of updates to the underlying data.
   * Field resolvers which fetch data can configure their own maxAge. All other non-scalar fields should configure
   * `@CacheControl(inheritFromParent: true)`, which `@CacheField` does automatically.
   */
  'require-cache-control': {
    meta: {
      type: 'problem',
      hasSuggestions: true,
      docs: {
        description: 'require cache control for graphql field',
        category: 'Possible Errors',
        recommended: true,
      },
      messages: {
        noCacheControl:
          'Fields resolving as objects should configure cache control to not break caching-logic in Apollo.',
      },
    },
    schema: [],
    create: function (context) {
      const scalarTypes = [
        'ID',
        'String',
        'Boolean',
        'Int',
        'Float',
        'Number',
        'Date',
      ]
      let hasImport = false
      let lastImport = null
      return {
        ImportDeclaration: (node) => {
          lastImport = node
        },
        'ImportDeclaration ImportSpecifier[local.name=CacheField]': (node) => {
          hasImport = true
          lastImport = node
        },
        'PropertyDefinition > Decorator > CallExpression[callee.name=Field] > ArrowFunctionExpression.arguments:first-child > .body':
          (node) => {
            const identifierName =
              node.type === 'Identifier'
                ? node.name
                : node.type === 'ArrayExpression' &&
                    node.elements[0].type === 'Identifier'
                  ? node.elements[0].name
                  : null

            const isScalarType =
              identifierName === null ||
              scalarTypes.includes(identifierName) ||
              identifierName.match(/json/i)
            const callExpressionNode = node.parent.parent
            const propertyNode = callExpressionNode.parent.parent
            const hasCacheControl = propertyNode.decorators.find(
              (decorator) =>
                decorator.expression?.callee?.name === 'CacheControl',
            )
            if (isScalarType || hasCacheControl) {
              return
            }

            context.report({
              node: callExpressionNode,
              messageId: 'noCacheControl',
              suggest: [
                {
                  desc: 'Use @CacheField() instead.',
                  fix: (fixer) => {
                    const fixes = [
                      fixer.replaceText(
                        callExpressionNode.callee,
                        'CacheField',
                      ),
                    ]
                    if (!hasImport) {
                      const newImport =
                        "import { CacheField } from '@island.is/nest/graphql';"
                      if (lastImport) {
                        // insert after the last import decl
                        fixes.push(
                          fixer.insertTextAfter(lastImport, `\n${newImport}`),
                        )
                      } else {
                        // insert at the start of the file
                        fixes.push(
                          fixer.insertTextAfterRange([0, 0], `${newImport}\n`),
                        )
                      }
                    }
                    return fixes
                  },
                },
              ],
            })
          },
      }
    },
  },
  /**
   * This rule enforces that NestJS controllers in the Legal Gazette API have proper
   * authentication and authorization decorators:
   *
   * Standard Controllers (user-facing):
   * - @ApiBearerAuth() for Swagger documentation
   * - @UseGuards(TokenJwtAuthGuard, AuthorizationGuard) for authentication
   * - Either @AdminAccess() or a scope decorator (@ApplicationWebScopes(), @PublicWebScopes(), etc.)
   *
   * Machine Client Controllers (external system integrations):
   * - @ApiBearerAuth() for Swagger documentation
   * - @UseGuards(TokenJwtAuthGuard, MachineClientGuard) for authentication
   * - No @AdminAccess() or scope decorators needed
   *
   * Island.is Application Controllers (citizen submissions):
   * - @ApiBearerAuth() for Swagger documentation
   * - @UseGuards(TokenJwtAuthGuard, CurrentNationalRegistryPersonGuard) for authentication
   * - No @AdminAccess() or scope decorators needed
   *
   * Public Controllers (no auth required):
   * - Use @PublicController() decorator to bypass all auth checks
   *
   * Abstract/Base Controllers (no HTTP method decorators):
   * - Automatically skipped - these are meant to be extended by other controllers
   * - Child controllers must have proper guards and decorators
   *
   * Note: Cannot mix AuthorizationGuard with MachineClientGuard or CurrentNationalRegistryPersonGuard
   *
   * This ensures all endpoints are properly secured and documented.
   */
  'require-controller-auth-decorators': {
    meta: {
      type: 'problem',
      docs: {
        description:
          'require authentication and authorization decorators on NestJS controllers',
        category: 'Security',
        recommended: true,
      },
      messages: {
        missingApiBearerAuth:
          'Controller is missing @ApiBearerAuth() decorator for Swagger documentation.',
        missingUseGuards:
          'Controller is missing @UseGuards() decorator. Use either @UseGuards(TokenJwtAuthGuard, AuthorizationGuard) for user-facing endpoints, @UseGuards(TokenJwtAuthGuard, MachineClientGuard) for external systems, or @UseGuards(TokenJwtAuthGuard, CurrentNationalRegistryPersonGuard) for island.is submissions.',
        missingAuthorizationDecorator:
          'Controller or method is missing authorization decorator. Use @AdminAccess() or a scope decorator (@ApplicationWebScopes(), @PublicWebScopes(), @PublicOrApplicationWebScopes()).',
        missingTokenJwtAuthGuard: '@UseGuards() is missing TokenJwtAuthGuard.',
        missingSecondGuard:
          '@UseGuards() is missing a second guard. Use AuthorizationGuard (for user-facing), MachineClientGuard (for external systems), or CurrentNationalRegistryPersonGuard (for island.is submissions).',
        mixedGuards:
          'Cannot mix AuthorizationGuard with MachineClientGuard or CurrentNationalRegistryPersonGuard. Use one or the other.',
        unnecessaryAuthDecorator:
          '@AdminAccess() and scope decorators (@ApplicationWebScopes, @PublicWebScopes, etc.) should only be used with AuthorizationGuard. Remove these decorators when using MachineClientGuard or CurrentNationalRegistryPersonGuard.',
      },
      schema: [],
    },
    create: function (context) {
      const scopeDecorators = [
        'ApplicationWebScopes',
        'PublicWebScopes',
        'PublicOrApplicationWebScopes',
      ]
      const authDecorators = ['AdminAccess', ...scopeDecorators]

      function hasDecorator(decorators, name) {
        if (!decorators) return false
        return decorators.some((decorator) => {
          const expr = decorator.expression
          // Handle @DecoratorName() - CallExpression
          if (expr?.type === 'CallExpression' && expr.callee?.name === name) {
            return true
          }
          // Handle @DecoratorName - Identifier (no parentheses)
          if (expr?.type === 'Identifier' && expr.name === name) {
            return true
          }
          return false
        })
      }

      function getGuardInfo(decorators) {
        if (!decorators)
          return {
            hasUseGuards: false,
            hasTokenJwt: false,
            hasAuthGuard: false,
            hasMachineClient: false,
            hasNationalRegistryGuard: false,
          }

        for (const decorator of decorators) {
          const expr = decorator.expression
          if (
            expr?.type === 'CallExpression' &&
            expr.callee?.name === 'UseGuards'
          ) {
            const args = expr.arguments || []
            const guardNames = args
              .filter((arg) => arg.type === 'Identifier')
              .map((arg) => arg.name)

            return {
              hasUseGuards: true,
              hasTokenJwt: guardNames.includes('TokenJwtAuthGuard'),
              hasAuthGuard: guardNames.includes('AuthorizationGuard'),
              hasMachineClient: guardNames.includes('MachineClientGuard'),
              hasNationalRegistryGuard: guardNames.includes(
                'CurrentNationalRegistryPersonGuard',
              ),
            }
          }
        }
        return {
          hasUseGuards: false,
          hasTokenJwt: false,
          hasAuthGuard: false,
          hasMachineClient: false,
          hasNationalRegistryGuard: false,
        }
      }

      function hasAnyAuthDecorator(decorators) {
        if (!decorators) return false
        return authDecorators.some((name) => hasDecorator(decorators, name))
      }

      // Check if a class has any HTTP method decorators (Get, Post, Put, Delete, Patch)
      function hasAnyHttpMethodDecorators(classBody) {
        const httpDecorators = ['Get', 'Post', 'Put', 'Delete', 'Patch']
        const methods = classBody?.body || []

        return methods.some((member) => {
          if (member.type !== 'MethodDefinition') return false
          return httpDecorators.some((name) =>
            hasDecorator(member.decorators, name),
          )
        })
      }

      return {
        // Check class-level decorators on @Controller classes
        ClassDeclaration: (node) => {
          const decorators = node.decorators
          if (!decorators) return

          // Check if this is a @Controller class
          const isController = hasDecorator(decorators, 'Controller')
          if (!isController) return

          // Check for @PublicController() - bypasses all auth checks
          const isPublicController = hasDecorator(decorators, 'PublicController')
          if (isPublicController) return

          // Check if this is an abstract/base controller (no HTTP method decorators)
          // These controllers are meant to be extended and don't need guards/auth decorators
          const hasHttpMethods = hasAnyHttpMethodDecorators(node.body)
          if (!hasHttpMethods) return

          // Check for @ApiBearerAuth()
          if (!hasDecorator(decorators, 'ApiBearerAuth')) {
            context.report({
              node,
              messageId: 'missingApiBearerAuth',
            })
          }

          // Check for @UseGuards with appropriate guards
          const guards = getGuardInfo(decorators)

          if (!guards.hasUseGuards) {
            context.report({
              node,
              messageId: 'missingUseGuards',
            })
            return // Can't check further without UseGuards
          }

          // Must have TokenJwtAuthGuard
          if (!guards.hasTokenJwt) {
            context.report({
              node,
              messageId: 'missingTokenJwtAuthGuard',
            })
          }

          // Cannot mix AuthorizationGuard with MachineClientGuard or CurrentNationalRegistryPersonGuard
          if (
            guards.hasAuthGuard &&
            (guards.hasMachineClient || guards.hasNationalRegistryGuard)
          ) {
            context.report({
              node,
              messageId: 'mixedGuards',
            })
            return
          }

          // Must have either AuthorizationGuard, MachineClientGuard, or CurrentNationalRegistryPersonGuard
          if (
            !guards.hasAuthGuard &&
            !guards.hasMachineClient &&
            !guards.hasNationalRegistryGuard
          ) {
            context.report({
              node,
              messageId: 'missingSecondGuard',
            })
            return
          }

          // If using MachineClientGuard or CurrentNationalRegistryPersonGuard, no need for auth decorators
          if (guards.hasMachineClient || guards.hasNationalRegistryGuard) {
            // Check that auth decorators are NOT used with these guards
            const hasClassAuth = hasAnyAuthDecorator(decorators)
            if (hasClassAuth) {
              context.report({
                node,
                messageId: 'unnecessaryAuthDecorator',
              })
            }

            // Also check methods for unnecessary auth decorators
            const classBody = node.body?.body || []
            const methods = classBody.filter(
              (member) =>
                member.type === 'MethodDefinition' &&
                member.kind === 'method' &&
                !member.static,
            )

            methods.forEach((method) => {
              if (hasAnyAuthDecorator(method.decorators)) {
                context.report({
                  node: method,
                  messageId: 'unnecessaryAuthDecorator',
                })
              }
            })

            return // These guards handle auth differently
          }

          // If using AuthorizationGuard, check for authorization decorator
          const hasClassAuth = hasAnyAuthDecorator(decorators)

          // If no class-level auth, check each method
          if (!hasClassAuth) {
            const classBody = node.body?.body || []
            const methods = classBody.filter(
              (member) =>
                member.type === 'MethodDefinition' &&
                member.kind === 'method' &&
                !member.static,
            )

            // Check if ALL methods have auth decorators
            const methodsWithoutAuth = methods.filter(
              (method) => !hasAnyAuthDecorator(method.decorators),
            )

            if (methodsWithoutAuth.length > 0) {
              // Report on the class if no class-level auth and some methods missing auth
              context.report({
                node,
                messageId: 'missingAuthorizationDecorator',
              })
            }
          }
        },

        // Also check individual methods that override class-level auth
        // (This is informational - methods can have scope decorators that work with class @AdminAccess)
        MethodDefinition: (node) => {
          // Only check if parent is a controller class
          const parent = node.parent?.parent
          if (!parent?.decorators) return

          const isController = hasDecorator(parent.decorators, 'Controller')
          if (!isController) return

          // Check if method has HTTP decorator (Get, Post, Put, Delete, Patch)
          const httpDecorators = ['Get', 'Post', 'Put', 'Delete', 'Patch']
          const isHttpMethod = httpDecorators.some((name) =>
            hasDecorator(node.decorators, name),
          )
          if (!isHttpMethod) return

          // If class has @AdminAccess and method has scope decorator, that's valid (OR logic)
          // If class has no auth and method has no auth, error was already reported on class
          // No additional method-level reporting needed for basic enforcement
        },
      }
    },
  },
  'disallow-common-typos': {
    meta: {
      type: 'problem',
      docs: {
        description: 'disallow common typos in string literals',
        category: 'Possible Errors',
        recommended: true,
      },
      messages: {
        typoFound: 'Did you mean "{{correct}}"? Found "{{incorrect}}".',
      },
      schema: [],
    },
    create: function (context) {
      // Map of incorrect -> correct spellings
      const typos = {
        logbirtingarblad: 'logbirtingablad',
        logbirtingarblað: 'logbirtingablað',
      }

      function checkForTypos(value, node) {
        if (typeof value !== 'string') return

        const lowerValue = value.toLowerCase()

        for (const [incorrect, correct] of Object.entries(typos)) {
          if (lowerValue.includes(incorrect.toLowerCase())) {
            context.report({
              node,
              messageId: 'typoFound',
              data: {
                incorrect,
                correct,
              },
            })
          }
        }
      }

      return {
        Literal(node) {
          checkForTypos(node.value, node)
        },
        TemplateElement(node) {
          if (node.value?.cooked) {
            checkForTypos(node.value.cooked, node)
          }
        },
      }
    },
  },
}
