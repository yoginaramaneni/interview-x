import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface AccordionItemProps {
  value: string;
  trigger: string;
  content: string | React.ReactNode;
}

interface AccordionProps {
  items: AccordionItemProps[];
  className?: string;
}

export const Accordion: React.FC<AccordionProps> = ({ items, className = '' }) => {
  const [openItem, setOpenItem] = useState<string | null>(null);

  const toggleItem = (val: string) => {
    setOpenItem((prev) => (prev === val ? null : val));
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {items.map((item) => {
        const isOpen = openItem === item.value;
        return (
          <div
            key={item.value}
            className="border border-slate-200 dark:border-slate-800 rounded-[14px] overflow-hidden bg-white dark:bg-slate-900 transition-colors"
          >
            <button
              onClick={() => toggleItem(item.value)}
              className="w-full flex items-center justify-between p-5 text-left font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
            >
              <span>{item.trigger}</span>
              <motion.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="text-slate-400 dark:text-slate-500"
              >
                <ChevronDown className="w-4 h-4" />
              </motion.div>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                >
                  <div className="p-5 pt-0 border-t border-slate-100 dark:border-slate-800 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    {item.content}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};
