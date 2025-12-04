import React from 'react';
import { APP_VERSION } from '../src/version';

export const DeveloperInfo: React.FC = () => {
  return (
    <div className="text-center py-2 text-xs text-gray-400">
      Sunbridger@{APP_VERSION}
    </div>
  );
};
