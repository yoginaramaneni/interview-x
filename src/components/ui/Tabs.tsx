import React, { createContext, useContext, useState } from 'react';

interface TabsContextType {
  activeTab: string;
  setActiveTab: (value: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

export const Tabs: React.FC<{
  defaultValue: string;
  children: React.ReactNode;
  className?: string;
}> = ({ defaultValue, children, className = '' }) => {
  const [activeTab, setActiveTab] = useState(defaultValue);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={`flex flex-col gap-4 ${className}`}>{children}</div>
    </TabsContext.Provider>
  );
};

export const TabsList: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <div className={`flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-[14px] w-fit ${className}`}>
      {children}
    </div>
  );
};

export const TabsTrigger: React.FC<{
  value: string;
  children: React.ReactNode;
  className?: string;
}> = ({ value, children, className = '' }) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsTrigger must be used within Tabs');
  
  const isActive = context.activeTab === value;

  return (
    <button
      onClick={() => context.setActiveTab(value)}
      className={`px-4 py-2 text-xs font-semibold select-none rounded-[10px] transition-all duration-200
        ${isActive 
          ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm' 
          : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
        }
        ${className}
      `}
    >
      {children}
    </button>
  );
};

export const TabsContent: React.FC<{
  value: string;
  children: React.ReactNode;
  className?: string;
}> = ({ value, children, className = '' }) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsContent must be used within Tabs');

  if (context.activeTab !== value) return null;

  return (
    <div className={`w-full transition-opacity duration-300 ${className}`}>
      {children}
    </div>
  );
};
