import filterEmptyParagraphsDeep from './utils/filters/filterEmptyParagraphsDeep';

// Set up DOM environment. This needs to be required, cjs doesn't allow top level await.
require('jsdom-global')();
global.MutationObserver = window.MutationObserver;

// These need to be required, not imported, and require the DOM to be set up.
const { rawHandler, serialize } = require('@wordpress/blocks');
const { registerCoreBlocks } = require('@wordpress/block-library');

// Register core blocks.
registerCoreBlocks();

const authenticateRequest = (event) => {
  const token = event.headers?.Authorization || event.headers?.authorization;
  const validToken = process.env.LAMBDA_SERVICE_AUTH_TOKEN; // Set this securely in your environment variables

  if (!token || token !== `Bearer ${validToken}`) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Unauthorized - Missing or Invalid Token' }),
    };
  }

  return null; // No error means authenticated
};

module.exports.getBlocks = async (event) => {
  const authError = authenticateRequest(event);
  if (authError) return authError;
  
  try {
    const body = JSON.parse(event.body);

    if (!body.html) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'HTML content is required in the request body.' }),
      };
    }

    const htmlContent = body.html;

    // Convert raw HTML to blocks
    const blocks = rawHandler({ HTML: htmlContent });

    return {
      statusCode: 200,
      body: JSON.stringify( {
        blocks,
        input: htmlContent,
      } )
    };
  } catch (error) {
    console.error('Error processing HTML to blocks:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};

module.exports.getMarkup = async (event) => {
  const authError = authenticateRequest(event);
  if (authError) return authError;

  try {
    const body = JSON.parse(event.body);

    if (!body.html) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'HTML content is required in the request body.' }),
      };
    }

    const htmlContent = body.html;

    // Convert raw HTML to blocks
    const blocks = rawHandler({ HTML: htmlContent });

    // Run filters
    const filteredBlocks = filterEmptyParagraphsDeep(blocks);

    // Serialize the blocks
    const serializedBlocks = serialize(filteredBlocks);

    return {
      statusCode: 200,
      body: JSON.stringify( {
        html: serializedBlocks,
      } )
    };
  } catch (error) {
    console.error('Error processing HTML to serialized html:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};