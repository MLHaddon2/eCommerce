import axios from 'axios';

export default axios.create({
    baseURL: 'http://localhost:5001'
});

export const setAuthToken = token => {
    if (token) {
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
    else
        delete axios.defaults.headers.common["Authorization"];
};