import { FC, MouseEvent, useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { MdClose, MdKeyboardArrowDown } from 'react-icons/md';
import clsx from 'clsx';
import { MdOutlineForum, MdOutlineAdb, MdOutlineEqualizer, MdSettings, MdOutlineMonitorWeight } from 'react-icons/md';
import  IconComponent from '../icons/icon/icon.tsx';
import './main-navigation.scss';

interface MenuItem {
  id?: string;
  label: TranslatedLabel;
  path?: string;
  target?: '_blank' | '_self';
  children?: MenuItem[];
}

interface TranslatedLabel {
  [lang: string] : string;
}

const MainNavigation: FC<{items: MenuItem[]}> = ({items}) => {

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  const menuIcons = [
    {
      id: 'conversations',
      icon: <MdOutlineForum />,
    },
    {
      id: 'training',
      icon: <MdOutlineAdb />,
    },
    {
      id: 'analytics',
      icon: <MdOutlineEqualizer />,
    },
    {
      id: 'settings',
      icon: <MdSettings />,
    },
    {
      id: 'monitoring',
      icon: <MdOutlineMonitorWeight />,
    },
  ];

  /** For real application menu items are filtered by user role */
  /** un-comment next part for filtering items by user role */

  /****
  const { data } = useQuery({
    queryKey: ['cs-get-user-role', 'prod', items[0]?.id],
    onSuccess: (res: any) => {
      const filteredItems = items.filter((item) => {
        const role = res.data.get_user[0].authorities[0]
        switch (role) {
          case 'ROLE_ADMINISTRATOR': return item.id
          case 'ROLE_SERVICE_MANAGER': return item.id != 'settings' && item.id != 'training'
          case 'ROLE_CUSTOMER_SUPPORT_AGENT': return item.id != 'settings' && item.id != 'analytics'
          case 'ROLE_CHATBOT_TRAINER': return item.id != 'settings' && item.id != 'conversations'
          case 'ROLE_ANALYST': return item.id == 'analytics'
          case 'ROLE_UNAUTHENTICATED': return
          default: return
        }
      }) ?? []
      setMenuItems(filteredItems)
    }
  });
  **/

  /** Remove this hook when using items filtering functionality above*/
  useEffect(() => {setMenuItems(items);}, []);

  const location = useLocation();
  const [navCollapsed, setNavCollapsed] = useState(false);

  const handleNavToggle = (event: MouseEvent) => {
    const isExpanded = event.currentTarget.getAttribute('aria-expanded') === 'true';
    event.currentTarget.setAttribute('aria-expanded', isExpanded ? 'false' : 'true');
  };

  const renderMenuTree = (menuItems: MenuItem[]) => {
    return menuItems.map((menuItem) => (
      <li key={menuItem.label['et']}>
        {!!menuItem.children ? (
          <>
            <button
              className={clsx('nav__toggle', { 'nav__toggle--icon': !!menuItem.id })}
              aria-expanded={menuItem.path && location.pathname.includes(menuItem.path) ? 'true' : 'false'}
              onClick={handleNavToggle}
            >
              {menuItem.id && (
                <IconComponent icon={menuIcons.find(icon => icon.id === menuItem.id)?.icon} />
              )}
              <span>{menuItem.label['et']}</span>
              <IconComponent icon={<MdKeyboardArrowDown />} />
            </button>
            <ul
              className='nav__submenu'>
              {renderMenuTree(menuItem.children)}
            </ul>
          </>
        ) : (
          <NavLink to={menuItem.path || '#'}>{menuItem.label['et']}</NavLink>
        )}
      </li>),
    );
  };

  if (!menuItems) return null;

  /** Use translations (button label 'Sulge') on dev/prod version */
  return (
    <nav className={clsx('nav', { 'nav--collapsed': navCollapsed })}>
      <button className='nav__menu-toggle' onClick={() => setNavCollapsed(!navCollapsed)}>
        <IconComponent icon={<MdClose />} />
        Sulge
      </button>
      <ul className='nav__menu'>
        {renderMenuTree(menuItems)}
      </ul>
    </nav>
  );
};

export default MainNavigation;
