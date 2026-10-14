import api from './axios';
import { API } from '../constants/apiEndpoints';
import { buildQueryString } from '../utils/helpers';

export const getGrades = (params) => api.get(`${API.GRADES.BASE}${buildQueryString(params)}`);
export const getGrade = (id) => api.get(API.GRADES.BY_ID(id));
export const createGrade = (data) => api.post(API.GRADES.BASE, data);
export const updateGrade = (id, data) => api.put(API.GRADES.BY_ID(id), data);
export const deleteGrade = (id) => api.delete(API.GRADES.BY_ID(id));
