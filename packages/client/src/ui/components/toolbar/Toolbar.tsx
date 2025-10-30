import { FC } from 'react';
import './Toolbar.scss';

interface ToolbarButton {
  id: string;
  icon: string;
  label: string;
  onClick: () => void;
}

export const Toolbar: FC = () => {
  const userFigure = 'hd-180-1.hr-100-61.ch-210-66.lg-270-82.sh-290-81';
  const userName = 'Guest';

  const mainActions: ToolbarButton[] = [
    {
      id: 'navigator',
      icon: '/assets/images/toolbar/icons/rooms.png',
      label: 'Navigator',
      onClick: () => {}
    },
    {
      id: 'catalog',
      icon: '/assets/images/toolbar/icons/catalog.png',
      label: 'Catalog',
      onClick: () => {}
    },
    {
      id: 'inventory',
      icon: '/assets/images/toolbar/icons/inventory.png',
      label: 'Inventory',
      onClick: () => {}
    },
    {
      id: 'camera',
      icon: '/assets/images/toolbar/icons/camera.png',
      label: 'Camera',
      onClick: () => {}
    }
  ];

  const settingsActions: ToolbarButton[] = [
    {
      id: 'friends',
      icon: '/assets/images/toolbar/icons/friend_all.png',
      label: 'Friends',
      onClick: () => {}
    },
    {
      id: 'messenger',
      icon: '/assets/images/toolbar/icons/message.png',
      label: 'Messenger',
      onClick: () => {}
    }
  ];

  return (
    <div className="nitro-toolbar">
      <div className="action-cluster">
        {mainActions.map(action => (
          <button
            key={action.id}
            className="toolbar-button"
            onClick={action.onClick}
            title={action.label}
          >
            <img src={action.icon} alt={action.label} />
          </button>
        ))}
      </div>

      <div className="user-cluster">
        <div className="toolbar-user-avatar" title={userName}>
          <div className="avatar-inner">
            <img
              src={`https://www.habbo.com/habbo-imaging/avatarimage?figure=${userFigure}&size=m&direction=2&head_direction=3&gesture=sml&headonly=1`}
              alt={userName}
            />
          </div>
        </div>
      </div>

      <div className="settings-cluster">
        {settingsActions.map(action => (
          <button
            key={action.id}
            className="toolbar-button"
            onClick={action.onClick}
            title={action.label}
          >
            <img src={action.icon} alt={action.label} />
          </button>
        ))}
      </div>
    </div>
  );
};
