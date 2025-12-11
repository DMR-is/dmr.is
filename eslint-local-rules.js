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
   * - @ApiBearerAuth() for Swagger documentation
   * - @UseGuards(TokenJwtAuthGuard, AuthorizationGuard) for authentication
   * - Either @AdminAccess() or a scope decorator (@ApplicationWebScopes(), @PublicWebScopes(), etc.)
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
          'Controller is missing @UseGuards(TokenJwtAuthGuard, AuthorizationGuard) decorator.',
        missingAuthorizationDecorator:
          'Controller or method is missing authorization decorator. Use @AdminAccess() or a scope decorator (@ApplicationWebScopes(), @PublicWebScopes(), @PublicOrApplicationWebScopes()).',
        missingTokenJwtAuthGuard:
          '@UseGuards() is missing TokenJwtAuthGuard.',
        missingAuthorizationGuard:
          '@UseGuards() is missing AuthorizationGuard.',
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

      function hasUseGuardsWithBoth(decorators) {
        if (!decorators) return { hasUseGuards: false, hasTokenJwt: false, hasAuthGuard: false }

        for (const decorator of decorators) {
          const expr = decorator.expression
          if (expr?.type === 'CallExpression' && expr.callee?.name === 'UseGuards') {
            const args = expr.arguments || []
            const guardNames = args
              .filter((arg) => arg.type === 'Identifier')
              .map((arg) => arg.name)

            return {
              hasUseGuards: true,
              hasTokenJwt: guardNames.includes('TokenJwtAuthGuard'),
              hasAuthGuard: guardNames.includes('AuthorizationGuard'),
            }
          }
        }
        return { hasUseGuards: false, hasTokenJwt: false, hasAuthGuard: false }
      }

      function hasAnyAuthDecorator(decorators) {
        if (!decorators) return false
        return authDecorators.some((name) => hasDecorator(decorators, name))
      }

      function hasScopeDecorator(decorators) {
        if (!decorators) return false
        return scopeDecorators.some((name) => hasDecorator(decorators, name))
      }

      return {
        // Check class-level decorators on @Controller classes
        ClassDeclaration: (node) => {
          const decorators = node.decorators
          if (!decorators) return

          // Check if this is a @Controller class
          const isController = hasDecorator(decorators, 'Controller')
          if (!isController) return

          // Check for @ApiBearerAuth()
          if (!hasDecorator(decorators, 'ApiBearerAuth')) {
            context.report({
              node,
              messageId: 'missingApiBearerAuth',
            })
          }

          // Check for @UseGuards with both guards
          const guards = hasUseGuardsWithBoth(decorators)
          if (!guards.hasUseGuards) {
            context.report({
              node,
              messageId: 'missingUseGuards',
            })
          } else {
            if (!guards.hasTokenJwt) {
              context.report({
                node,
                messageId: 'missingTokenJwtAuthGuard',
              })
            }
            if (!guards.hasAuthGuard) {
              context.report({
                node,
                messageId: 'missingAuthorizationGuard',
              })
            }
          }

          // Check for authorization decorator at class level
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
}
