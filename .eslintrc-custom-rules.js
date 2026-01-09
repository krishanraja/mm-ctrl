/**
 * Custom ESLint Rules for Video Background Architecture
 * 
 * Note: This file documents the rule logic. The actual enforcement
 * is done via the build validation script (scripts/validate-video-backgrounds.js)
 * which is more reliable and runs in CI/CD.
 * 
 * Rule: no-bg-background-on-root
 * Prevents bg-background on App.tsx root component to avoid blocking video backgrounds
 */

// This rule would be implemented as a custom ESLint plugin in a full setup.
// For now, we use build-time validation script instead.

module.exports = {
  // Rule logic documented for future ESLint plugin implementation
  'no-bg-background-on-root': {
    meta: {
      type: 'problem',
      docs: {
        description: 'Prevent bg-background on root App component',
        category: 'Best Practices',
        recommended: true,
      },
      fixable: null,
      schema: [],
    },
    create(context) {
      return {
        JSXOpeningElement(node) {
          if (node.name.name === 'div') {
            const classNameAttr = node.attributes.find(
              attr => attr.type === 'JSXAttribute' && attr.name.name === 'className'
            );
            
            if (classNameAttr?.value) {
              let classNameValue = '';
              
              if (classNameAttr.value.type === 'Literal') {
                classNameValue = classNameAttr.value.value;
              } else if (classNameAttr.value.type === 'JSXExpressionContainer' &&
                         classNameAttr.value.expression.type === 'Literal') {
                classNameValue = classNameAttr.value.expression.value;
              }
              
              if (typeof classNameValue === 'string' && 
                  classNameValue.includes('bg-background') &&
                  classNameValue.includes('min-h-screen')) {
                const filename = context.getFilename();
                if (filename.includes('App.tsx') || filename.includes('App.jsx')) {
                  context.report({
                    node,
                    message: 'Do not use bg-background on root App component. It blocks video backgrounds. Use component-level backgrounds instead. Run "npm run validate:video" to check.',
                  });
                }
              }
            }
          }
        },
      };
    },
  },
};
