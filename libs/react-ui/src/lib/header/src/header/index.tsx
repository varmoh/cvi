import React, {FC, useEffect, useMemo, useState, useContext, PropsWithChildren} from 'react';
import { useTranslation } from 'react-i18next';
import { Subscription, interval } from 'rxjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useIdleTimer } from 'react-idle-timer';
import { MdOutlineExpandMore } from 'react-icons/md';
import { useCookies } from 'react-cookie';
import {
  Switch,
  Dialog,
  Track,
  Button,
  Icon
} from "./components";

import UserSettings from "./components/UserSettings/userSettings";
import { ToastContext } from './components/Toast/ToastContext';
import { Chat, CHAT_STATUS } from './types/chat';
import {USER_IDLE_STATUS_TIMEOUT, STATUS_COLORS, SUBSCRIPTION_INTERVAL} from './consts/consts';

import * as API_CONF from './services/api-conf';
import api from './services/api';

import './Header.scss';
import { ReactComponent as Logo } from './assets/logo.svg';
import chatSound from './assets/chatSound.mp3';
import {CustomerSupportActivity} from "./types/customerSupportActivity";
import {UserProfileSettings} from "./types/userProfileSettings";
import {StoreState} from "./types/storeState";

const useToast = () => useContext(ToastContext);

type CustomerSupportActivityDTO = {
  customerSupportActive: boolean;
  customerSupportStatus: 'offline' | 'idle' | 'online';
  customerSupportId: string;
};

type UserStoreStateProps = {
  analticsUrl: string;
  baseUrl: string;
  baseUrlV2: string;
  user: StoreState;

}
const Header: FC<PropsWithChildren<UserStoreStateProps>> = ({user,baseUrl,baseUrlV2, analticsUrl}) => {
  const { t } = useTranslation();
  const { userInfo } = user;
  const toast = useToast();
  const [__, setSecondsUntilStatusPopup] = useState(300); // 5 minutes in seconds
  const [statusPopupTimerHasStarted, setStatusPopupTimerHasStarted] =
    useState(false);
  const [showStatusConfirmationModal, setShowStatusConfirmationModal] =
    useState(false);

  const queryClient = useQueryClient();
  const [userDrawerOpen, setUserDrawerOpen] = useState(false);
  const [csaStatus, setCsaStatus] = useState<'idle' | 'offline' | 'online'>(
    'online'
  );
  const audio = useMemo(() => new Audio(chatSound), []);
  const [csaActive, setCsaActive] = useState<boolean>(false);
  const [userProfileSettings, setUserProfileSettings] =
    useState<UserProfileSettings>({
      userId: 1,
      forwardedChatPopupNotifications: false,
      forwardedChatSoundNotifications: true,
      forwardedChatEmailNotifications: false,
      newChatPopupNotifications: false,
      newChatSoundNotifications: true,
      newChatEmailNotifications: false,
      useAutocorrect: true,
    });

  useEffect(() => {
    getMessages();
  }, []);

  const getMessages = async () => {
    const { data: res } = await api(analticsUrl).get(API_CONF.GET_USER_PROFILE_SETTINGS, {
      params: {
        // TODO: Use actual id from userInfo once it starts using real data
        userId: userInfo?.idCode,
      },
    });
    if (res.response) setUserProfileSettings(res.response);
  };

  const { data: customerSupportActivity } = useQuery<CustomerSupportActivity>({
    queryKey: [API_CONF.GET_CUSTOMER_SUPPORT_ACTIVITY, 'prod'],
    onSuccess(res: any) {
      const activity = res.data.get_customer_support_activity[0];
      setCsaStatus(activity.status);
      setCsaActive(activity.active === 'true');
    },
  });
  const [activeChatsList, setActiveChatsList] = useState<Chat[]>([]);

  useQuery<Chat[]>({
    queryKey: [API_CONF.GET_ALL_ACTIVE_CHATS, 'prod'],
    onSuccess(res: any) {
      setActiveChatsList(res.data.get_all_active_chats);
    },
  });
  const customJwtCookieKey = 'customJwtCookie';
  const [_, setCookie] = useCookies([customJwtCookieKey]);

  const unansweredChats = useMemo(
    () =>
      activeChatsList
        ? activeChatsList.filter((c) => c.customerSupportId === '').length
        : 0,
    [activeChatsList]
  );
  const forwardedChats = useMemo(
    () =>
      activeChatsList
        ? activeChatsList.filter(
          (c) =>
            c.status === CHAT_STATUS.REDIRECTED &&
            c.customerSupportId === userInfo?.idCode
        ).length
        : 0,
    [activeChatsList]
  );

  useEffect(() => {
    let subscription: Subscription;
    if (forwardedChats > 0) {
      if (userProfileSettings.forwardedChatSoundNotifications) audio.play();
      if (userProfileSettings.forwardedChatEmailNotifications)
        if (userProfileSettings.forwardedChatPopupNotifications) {
          // TODO send email notification
          toast.open({
            type: 'info',
            title: t('global.notification'),
            message: t('settings.users.newForwardedChat'),
          });
        }
      subscription = interval(SUBSCRIPTION_INTERVAL).subscribe(() => {
        if (userProfileSettings.forwardedChatSoundNotifications) audio.play();
        if (userProfileSettings.forwardedChatPopupNotifications) {
          toast.open({
            type: 'info',
            title: t('global.notification'),
            message: t('settings.users.newForwardedChat'),
          });
        }
      });
    }
    return () => {
      if (subscription) subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forwardedChats]);

  const customerSupportActivityMutation = useMutation({
    mutationFn: (data: CustomerSupportActivityDTO) => api(baseUrl).post(API_CONF.SET_CUSTOMER_SUPPORT_ACTIVITY, {
      customerSupportId: data.customerSupportId,
      customerSupportActive: data.customerSupportActive,
      customerSupportStatus: data.customerSupportStatus
    }),
    onSuccess: () => {
      if (csaStatus === 'online') extendUserSessionMutation.mutate()
    },
    onError: async (error: AxiosError) => {
      await queryClient.invalidateQueries([
        API_CONF.GET_CUSTOMER_SUPPORT_ACTIVITY,
        'prod',
      ]);
      toast.open({
        type: 'error',
        title: t('global.notificationError'),
        message: error.message,
      });
    },
  });

  const setNewCookie = (cookieValue: string) => {
    const cookieOptions = { path: '/' };
    setCookie(customJwtCookieKey, cookieValue, cookieOptions);
  };

  const extendUserSessionMutation = useMutation({
    mutationFn: async () => {
      const {
        data: { data },
      } = await api(baseUrl).post(API_CONF.CUSTOM_JWT_EXTEND, {});
      if (data.custom_jwt_extend === null) return;
      setNewCookie(data.custom_jwt_extend);
    },
    onError: (error: AxiosError) => {
      console.log('E: ', error);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => api(baseUrl).post(API_CONF.LOGOUT),
    onSuccess(_) {
      window.location.href = API_CONF.LOGIN_LINK;
    },
    onError: async (error: AxiosError) => {
      toast.open({
        type: 'error',
        title: t('global.notificationError'),
        message: error.message,
      });
    },
  });

  const onIdle = () => {
    if (!customerSupportActivity) return;
    if (csaStatus === 'offline') return;

    setCsaStatus('idle');
    customerSupportActivityMutation.mutate({
      customerSupportActive: csaActive,
      customerSupportId: customerSupportActivity.idCode,
      customerSupportStatus: 'idle',
    });
  };

  const onActive = () => {
    if (!customerSupportActivity) return;
    if (csaStatus === 'offline') {
      setShowStatusConfirmationModal((value) => !value);
      return;
    }

    setCsaStatus('online');
    customerSupportActivityMutation.mutate({
      customerSupportActive: csaActive,
      customerSupportId: customerSupportActivity.idCode,
      customerSupportStatus: 'online',
    });
  };

  const { getRemainingTime } = useIdleTimer({
    onIdle,
    onActive,
    timeout: USER_IDLE_STATUS_TIMEOUT,
    throttle: 500,
  });

  const handleCsaStatusChange = (checked: boolean) => {
    setCsaActive(checked);
    customerSupportActivityMutation.mutate({
      customerSupportActive: checked,
      customerSupportStatus: checked === true ? 'online' : 'offline',
      customerSupportId: '',
    });

    if (!checked) showStatusChangePopup();
  };

  const showStatusChangePopup = () => {
    if (statusPopupTimerHasStarted) return;

    setStatusPopupTimerHasStarted((value) => !value);
    const timer = setInterval(() => {
      setSecondsUntilStatusPopup((prevSeconds) => {
        if (prevSeconds > 0) {
          return prevSeconds - 1;
        } else {
          clearInterval(timer);
          setShowStatusConfirmationModal((value) => !value);
          setStatusPopupTimerHasStarted((value) => !value);
          return 0;
        }
      });
    }, 1000);
  };

  return (
    <>
      <header className="header">
        <Track justify="between">
           <Logo height={50} />

          {userInfo && (
            <Track gap={32}>
              <Track gap={16}>
                <label
                  style={{
                    color: '#5D6071',
                    fontSize: 14,
                    textTransform: 'lowercase',
                  }}
                >
                  <strong>{unansweredChats}</strong> {t('chat.unanswered')}
                  {' '}
                  <strong>{forwardedChats}</strong> {t('chat.forwarded')}
                </label>
                <Switch
                  onCheckedChange={handleCsaStatusChange}
                  checked={csaActive}
                  label={t('global.csaStatus')}
                  hideLabel
                  name="csaStatus"
                  onColor="#308653"
                  onLabel={t('global.present') || ''}
                  offLabel={t('global.away') || ''}
                />
              </Track>
              <span
                style={{
                  display: 'block',
                  width: 2,
                  height: 30,
                  backgroundColor: '#DBDFE2',
                }}
              ></span>
              <Button
                appearance="text"
                onClick={() => setUserDrawerOpen(!userDrawerOpen)}
              >
                <Track>
                  <span
                      style={{
                        display: 'block',
                        width: 16,
                        // verticalAlign: 'bottom',
                        height: 16,
                        borderRadius: '50%',
                        backgroundColor: STATUS_COLORS[csaStatus],
                        marginRight: 8,
                      }}
                  ></span>
                  {userInfo.displayName}
                  <Icon icon={<MdOutlineExpandMore />} />
                </Track>
              </Button>
              <span className={'btn btn--text'} style={{ textDecoration: 'underline' }}>
              <Button
                appearance="text"
                onClick={() => logoutMutation.mutate()}
              >
                {t('global.logout')}
              </Button>
                </span>
            </Track>
          )}
        </Track>
      </header>

      {showStatusConfirmationModal && (
        <Dialog
          onClose={() => setShowStatusConfirmationModal((value) => !value)}
          footer={
            <>
              <Button
                appearance="secondary"
                onClick={() =>
                  setShowStatusConfirmationModal((value) => !value)
                }
              >
                {t('global.cancel')}
              </Button>
              <Button
                appearance="primary"
                onClick={() => {
                  handleCsaStatusChange(true);
                  setShowStatusConfirmationModal((value) => !value);
                }}
              >
                {t('global.yes')}
              </Button>
            </>
          }
        >
          <div className="dialog__body">
            <h1
              style={{ fontSize: '24px', fontWeight: '400', color: '#09090B' }}
            >
              {t('global.statusChangeQuestion')}
            </h1>
          </div>
        </Dialog>
      )}

      {userInfo && userProfileSettings && userDrawerOpen && (
          <UserSettings
              stateUpdate={() => {setUserDrawerOpen(false)}}
              baseUrlV2={baseUrlV2}
              user={user}
          />
      )}
    </>
  );
};

export default Header;
