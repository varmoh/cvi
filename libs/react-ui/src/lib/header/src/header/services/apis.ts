import axios, {AxiosError} from 'axios';

let baseUrl = '';
if(import.meta.env.REACT_APP_MOCK_ENABLED === 'true') {
    baseUrl = '/api';
} else {
    baseUrl = import.meta.env.BASE_URL + import.meta.env.REACT_APP_BASE_API_PATH;
}

const instance = axios.create({
    baseURL: baseUrl,
    headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

instance.interceptors.response.use(
    (response) => {
        return response;
    },
    (error: AxiosError) => {
        if (error.response?.status === 401) {
            //TODO: handle unauthorized requests
        }
        return Promise.reject(error);
    },
);

export default instance;
