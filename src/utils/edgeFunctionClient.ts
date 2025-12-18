import { supabase } from '@/integrations/supabase/client';

interface EdgeFunctionOptions {
  silent?: boolean;
  logPrefix?: string;
  showToast?: boolean;
  timeout?: number; // Fix #9: Timeout in milliseconds (default 30s)
}

interface EdgeFunctionResult<T = any> {
  data: T | null;
  error: any;
}

/**
 * Standardized edge function invocation with consistent error handling and logging
 * @param functionName - Name of the edge function to invoke
 * @param body - Request body to send to the function
 * @param options - Optional configuration for logging and error handling
 */
export async function invokeEdgeFunction<T = any>(
  functionName: string,
  body: any,
  options: EdgeFunctionOptions = {}
): Promise<EdgeFunctionResult<T>> {
  const { silent = false, logPrefix = '🔧', timeout = 30000 } = options; // Fix #9: Default 30s timeout

  // #region agent log
  fetch('http://127.0.0.1:7245/ingest/c6724669-2c15-4044-bf26-19693227e3c6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'edgeFunctionClient.ts:invokeEdgeFunction',message:`Invoking edge function: ${functionName}`,data:{hypothesisId:'C',functionName:functionName,bodyKeys:Object.keys(body || {}),hasBody:!!body},timestamp:Date.now(),sessionId:'debug-session'})}).catch(()=>{});
  // #endregion

  if (!silent) {
    console.log(`${logPrefix} Invoking edge function: ${functionName}`, { body });
  }

  try {
    // Fix #9: Add timeout wrapper
    const timeoutPromise = new Promise<EdgeFunctionResult<T>>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Edge function ${functionName} timed out after ${timeout}ms`));
      }, timeout);
    });

    const invokePromise = (async () => {
      const { data, error } = await supabase.functions.invoke(functionName, { body });

      if (error) {
        // #region agent log
        fetch('http://127.0.0.1:7245/ingest/c6724669-2c15-4044-bf26-19693227e3c6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'edgeFunctionClient.ts:invokeEdgeFunction:error',message:`Edge function error: ${functionName}`,data:{hypothesisId:'C',functionName:functionName,error:String(error?.message || error)},timestamp:Date.now(),sessionId:'debug-session'})}).catch(()=>{});
        // #endregion
        console.error(`❌ Edge function error (${functionName}):`, error);
        return { data: null, error };
      }

      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/c6724669-2c15-4044-bf26-19693227e3c6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'edgeFunctionClient.ts:invokeEdgeFunction:success',message:`Edge function success: ${functionName}`,data:{hypothesisId:'C',functionName:functionName,hasData:!!data},timestamp:Date.now(),sessionId:'debug-session'})}).catch(()=>{});
      // #endregion

      if (!silent) {
        console.log(`✅ Edge function success (${functionName}):`, data);
      }

      return { data, error: null };
    })();

    const result = await Promise.race([invokePromise, timeoutPromise]);
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Edge function exception (${functionName}):`, errorMessage);
    
    // Check if it's a timeout error
    if (errorMessage.includes('timed out')) {
      return { 
        data: null, 
        error: { message: `Request timed out after ${timeout}ms`, name: 'TimeoutError' } 
      };
    }
    
    return { data: null, error: { message: errorMessage, name: 'Error' } };
  }
}
