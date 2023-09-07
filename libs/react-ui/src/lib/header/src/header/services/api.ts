import axios, {AxiosError} from 'axios';
const apiInstance = (baseUrl: string) => {
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
    return instance;
};

export default apiInstance;
