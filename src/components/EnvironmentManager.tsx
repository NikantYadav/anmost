import React, { useState } from 'react';

interface Variable {
  key: string;
  value: string;
  enabled: boolean;
}

interface Environment {
  id: string;
  name: string;
  variables: Variable[];
}

interface EnvironmentManagerProps {
  environments: Environment[];
  onEnvironmentsChange: (environments: Environment[]) => void;
  onClose: () => void;
}

export default function EnvironmentManager({ environments, onEnvironmentsChange, onClose }: EnvironmentManagerProps) {
  const [selectedEnv, setSelectedEnv] = useState<string>(environments[0]?.id || '');
  const [newEnvName, setNewEnvName] = useState('');

  const currentEnv = environments.find(env => env.id === selectedEnv);

  const createEnvironment = () => {
    if (!newEnvName.trim()) return;
    
    const newEnv: Environment = {
      id: Date.now().toString(),
      name: newEnvName,
      variables: [{ key: '', value: '', enabled: true }]
    };
    
    const updatedEnvs = [...environments, newEnv];
    onEnvironmentsChange(updatedEnvs);
    setSelectedEnv(newEnv.id);
    setNewEnvName('');
  };

  const deleteEnvironment = (envId: string) => {
    const updatedEnvs = environments.filter(env => env.id !== envId);
    onEnvironmentsChange(updatedEnvs);
    if (selectedEnv === envId) {
      setSelectedEnv(updatedEnvs[0]?.id || '');
    }
  };

  const addVariable = () => {
    if (!currentEnv) return;
    
    const updatedEnv = {
      ...currentEnv,
      variables: [...currentEnv.variables, { key: '', value: '', enabled: true }]
    };
    
    const updatedEnvs = environments.map(env => 
      env.id === selectedEnv ? updatedEnv : env
    );
    
    onEnvironmentsChange(updatedEnvs);
  };

  const updateVariable = (index: number, field: keyof Variable, value: string | boolean) => {
    if (!currentEnv) return;
    
    const updatedEnv = {
      ...currentEnv,
      variables: currentEnv.variables.map((variable, i) => 
        i === index ? { ...variable, [field]: value } : variable
      )
    };
    
    const updatedEnvs = environments.map(env => 
      env.id === selectedEnv ? updatedEnv : env
    );
    
    onEnvironmentsChange(updatedEnvs);
  };

  const removeVariable = (index: number) => {
    if (!currentEnv) return;
    
    const updatedEnv = {
      ...currentEnv,
      variables: currentEnv.variables.filter((_, i) => i !== index)
    };
    
    const updatedEnvs = environments.map(env => 
      env.id === selectedEnv ? updatedEnv : env
    );
    
    onEnvironmentsChange(updatedEnvs);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl h-3/4 flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Environment Manager</h2>
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
          {/* Environment List */}
          <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 p-4">
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newEnvName}
                onChange={(e) => setNewEnvName(e.target.value)}
                placeholder="Environment name"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                onKeyPress={(e) => e.key === 'Enter' && createEnvironment()}
              />
              <button
                onClick={createEnvironment}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
              >
                Add
              </button>
            </div>

            <div className="space-y-2">
              {environments.map(env => (
                <div
                  key={env.id}
                  className={`flex items-center justify-between p-3 rounded cursor-pointer ${
                    selectedEnv === env.id
                      ? 'bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => setSelectedEnv(env.id)}
                >
                  <span className="text-gray-900 dark:text-white font-medium">{env.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteEnvironment(env.id);
                    }}
                    className="p-1 text-red-600 hover:bg-red-100 rounded"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Variables Editor */}
          <div className="flex-1 p-4">
            {currentEnv ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Variables for {currentEnv.name}
                  </h3>
                  <button
                    onClick={addVariable}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                  >
                    Add Variable
                  </button>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {currentEnv.variables.map((variable, index) => (
                    <div key={index} className="flex gap-3 items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                      <input
                        type="checkbox"
                        checked={variable.enabled}
                        onChange={(e) => updateVariable(index, 'enabled', e.target.checked)}
                        className="rounded"
                      />
                      <input
                        type="text"
                        value={variable.key}
                        onChange={(e) => updateVariable(index, 'key', e.target.value)}
                        placeholder="Variable name"
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                      />
                      <input
                        type="text"
                        value={variable.value}
                        onChange={(e) => updateVariable(index, 'value', e.target.value)}
                        placeholder="Variable value"
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                      />
                      <button
                        onClick={() => removeVariable(index)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Usage</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Use variables in your requests with double curly braces: <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">{'{{variable_name}}'}</code>
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <p>Create an environment to get started</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}