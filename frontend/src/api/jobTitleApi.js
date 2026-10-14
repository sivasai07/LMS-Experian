import api from './axios';
import { API } from '../constants/apiEndpoints';
import { buildQueryString } from '../utils/helpers';

export const getJobTitles = (params) => api.get(`${API.JOB_TITLES.BASE}${buildQueryString(params)}`);
export const getJobTitle = (id) => api.get(API.JOB_TITLES.BY_ID(id));
export const createJobTitle = (data) => api.post(API.JOB_TITLES.BASE, data);
export const updateJobTitle = (id, data) => api.put(API.JOB_TITLES.BY_ID(id), data);
export const deleteJobTitle = (id) => api.delete(API.JOB_TITLES.BY_ID(id));
