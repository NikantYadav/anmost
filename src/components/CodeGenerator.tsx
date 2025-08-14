import React, { useState } from 'react';

interface Request {
  method: string;
  url: string;
  headers: { key: string; value: string; enabled: boolean }[];
  body: string;
}

interface CodeGeneratorProps {
  request: Request;
  onClose: () => void;
}

const languages = [
  'curl',
  'javascript-fetch',
  'javascript-axios',
  'python-requests',
  'node-axios',
  'php-curl',
  'java-okhttp',
  'csharp-httpclient'
];

export default function CodeGenerator({ request, onClose }: CodeGeneratorProps) {
  const [selectedLanguage, setSelectedLanguage] = useState('curl');
  const [copied, setCopied] = useState(false);

  const generateCode = (language: string): string => {
    const { method, url, headers, body } = request;
    const enabledHeaders = headers.filter(h => h.enabled && h.key && h.value);

    switch (language) {
      case 'curl':
        let curlCmd = `curl -X ${method} "${url}"`;
        enabledHeaders.forEach(header => {
          curlCmd += ` \\\n  -H "${header.key}: ${header.value}"`;
        });
        if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
          curlCmd += ` \\\n  -d '${body}'`;
        }
        return curlCmd;

      case 'javascript-fetch':
        const fetchHeaders = enabledHeaders.reduce((acc, header) => {
          acc[header.key] = header.value;
          return acc;
        }, {} as Record<string, string>);

        let fetchCode = `fetch("${url}", {\n  method: "${method}"`;
        if (Object.keys(fetchHeaders).length > 0) {
          fetchCode += `,\n  headers: ${JSON.stringify(fetchHeaders, null, 4)}`;
        }
        if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
          fetchCode += `,\n  body: ${JSON.stringify(body)}`;
        }
        fetchCode += `\n})\n.then(response => response.json())\n.then(data => console.log(data))\n.catch(error => console.error('Error:', error));`;
        return fetchCode;

      case 'javascript-axios':
        let axiosCode = `const axios = require('axios');\n\n`;
        axiosCode += `const config = {\n  method: '${method.toLowerCase()}',\n  url: '${url}'`;
        if (Object.keys(enabledHeaders).length > 0) {
          const axiosHeaders = enabledHeaders.reduce((acc, header) => {
            acc[header.key] = header.value;
            return acc;
          }, {} as Record<string, string>);
          axiosCode += `,\n  headers: ${JSON.stringify(axiosHeaders, null, 4)}`;
        }
        if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
          axiosCode += `,\n  data: ${JSON.stringify(body)}`;
        }
        axiosCode += `\n};\n\naxios(config)\n.then(response => {\n  console.log(response.data);\n})\n.catch(error => {\n  console.log(error);\n});`;
        return axiosCode;

      case 'python-requests':
        let pythonCode = `import requests\nimport json\n\n`;
        pythonCode += `url = "${url}"\n\n`;
        if (enabledHeaders.length > 0) {
          const pythonHeaders = enabledHeaders.reduce((acc, header) => {
            acc[header.key] = header.value;
            return acc;
          }, {} as Record<string, string>);
          pythonCode += `headers = ${JSON.stringify(pythonHeaders, null, 4)}\n\n`;
        }
        if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
          pythonCode += `payload = ${JSON.stringify(body)}\n\n`;
        }
        pythonCode += `response = requests.request("${method}", url`;
        if (enabledHeaders.length > 0) pythonCode += `, headers=headers`;
        if (body && ['POST', 'PUT', 'PATCH'].includes(method)) pythonCode += `, data=payload`;
        pythonCode += `)\n\nprint(response.text)`;
        return pythonCode;

      case 'node-axios':
        let nodeCode = `const axios = require('axios');\n\n`;
        nodeCode += `axios({\n  method: '${method.toLowerCase()}',\n  url: '${url}'`;
        if (enabledHeaders.length > 0) {
          const nodeHeaders = enabledHeaders.reduce((acc, header) => {
            acc[header.key] = header.value;
            return acc;
          }, {} as Record<string, string>);
          nodeCode += `,\n  headers: ${JSON.stringify(nodeHeaders, null, 4)}`;
        }
        if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
          nodeCode += `,\n  data: ${JSON.stringify(body)}`;
        }
        nodeCode += `\n})\n.then(response => {\n  console.log(response.data);\n})\n.catch(error => {\n  console.error(error);\n});`;
        return nodeCode;

      case 'php-curl':
        let phpCode = `<?php\n\n$curl = curl_init();\n\n`;
        phpCode += `curl_setopt_array($curl, array(\n  CURLOPT_URL => '${url}',\n  CURLOPT_RETURNTRANSFER => true,\n  CURLOPT_ENCODING => '',\n  CURLOPT_MAXREDIRS => 10,\n  CURLOPT_TIMEOUT => 0,\n  CURLOPT_FOLLOWLOCATION => true,\n  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,\n  CURLOPT_CUSTOMREQUEST => '${method}'`;
        if (enabledHeaders.length > 0) {
          const phpHeaders = enabledHeaders.map(h => `'${h.key}: ${h.value}'`);
          phpCode += `,\n  CURLOPT_HTTPHEADER => array(\n    ${phpHeaders.join(',\n    ')}\n  )`;
        }
        if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
          phpCode += `,\n  CURLOPT_POSTFIELDS => '${body}'`;
        }
        phpCode += `\n));\n\n$response = curl_exec($curl);\n\ncurl_close($curl);\necho $response;\n?>`;
        return phpCode;

      case 'java-okhttp':
        let javaCode = `OkHttpClient client = new OkHttpClient().newBuilder().build();\n`;
        if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
          javaCode += `MediaType mediaType = MediaType.parse("application/json");\n`;
          javaCode += `RequestBody body = RequestBody.create(mediaType, "${body.replace(/"/g, '\\"')}");\n`;
        }
        javaCode += `Request request = new Request.Builder()\n  .url("${url}")\n  .method("${method}"`;
        if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
          javaCode += `, body`;
        } else {
          javaCode += `, null`;
        }
        javaCode += `)\n`;
        enabledHeaders.forEach(header => {
          javaCode += `  .addHeader("${header.key}", "${header.value}")\n`;
        });
        javaCode += `  .build();\nResponse response = client.newCall(request).execute();`;
        return javaCode;

      case 'csharp-httpclient':
        let csharpCode = `var client = new HttpClient();\n`;
        csharpCode += `var request = new HttpRequestMessage(HttpMethod.${method.charAt(0) + method.slice(1).toLowerCase()}, "${url}");\n`;
        enabledHeaders.forEach(header => {
          csharpCode += `request.Headers.Add("${header.key}", "${header.value}");\n`;
        });
        if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
          csharpCode += `var content = new StringContent("${body.replace(/"/g, '\\"')}", Encoding.UTF8, "application/json");\n`;
          csharpCode += `request.Content = content;\n`;
        }
        csharpCode += `var response = await client.SendAsync(request);\nresponse.EnsureSuccessStatusCode();\nconsole.WriteLine(await response.Content.ReadAsStringAsync());`;
        return csharpCode;

      default:
        return 'Language not supported';
    }
  };

  const copyToClipboard = async () => {
    const code = generateCode(selectedLanguage);
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const getLanguageLabel = (lang: string): string => {
    const labels: Record<string, string> = {
      'curl': 'cURL',
      'javascript-fetch': 'JavaScript (Fetch)',
      'javascript-axios': 'JavaScript (Axios)',
      'python-requests': 'Python (Requests)',
      'node-axios': 'Node.js (Axios)',
      'php-curl': 'PHP (cURL)',
      'java-okhttp': 'Java (OkHttp)',
      'csharp-httpclient': 'C# (HttpClient)'
    };
    return labels[lang] || lang;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl h-3/4 flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Generate Code</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Language Selection */}
          <div className="w-1/4 border-r border-gray-200 dark:border-gray-700 p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-4">Language</h3>
            <div className="space-y-2">
              {languages.map(lang => (
                <button
                  key={lang}
                  onClick={() => setSelectedLanguage(lang)}
                  className={`w-full text-left p-3 rounded text-sm ${
                    selectedLanguage === lang
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 border border-blue-300 dark:border-blue-700'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {getLanguageLabel(lang)}
                </button>
              ))}
            </div>
          </div>

          {/* Code Display */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-medium text-gray-900 dark:text-white">
                {getLanguageLabel(selectedLanguage)}
              </h3>
              <button
                onClick={copyToClipboard}
                className={`px-4 py-2 rounded text-sm font-medium ${
                  copied
                    ? 'bg-green-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {copied ? 'Copied!' : 'Copy Code'}
              </button>
            </div>

            <div className="flex-1 p-4 overflow-auto">
              <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded text-sm font-mono overflow-auto h-full">
                <code className="text-gray-800 dark:text-gray-200">
                  {generateCode(selectedLanguage)}
                </code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}