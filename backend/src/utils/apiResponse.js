/**
 * Standard API response envelope helpers matching Laravel's ApiResponseTrait.
 */

export const success = (res, data = null, message = '', status = 200, meta = null) => {
  const response = {
    success: true,
    message,
    data,
  };

  if (meta !== null && meta !== undefined) {
    response.meta = meta;
  }

  return res.status(status).json(response);
};

export const paginatedSuccess = (res, data, pagination, message = '') => {
  return success(res, data, message, 200, {
    current_page: pagination.currentPage,
    per_page: pagination.perPage,
    total: pagination.total !== undefined ? pagination.total : (pagination.count !== undefined ? pagination.count : 0),
    last_page: pagination.lastPage,
  });
};

export const error = (res, message, errors = {}, code = '', status = 400) => {
  return res.status(status).json({
    success: false,
    message,
    errors,
    code,
  });
};

export default {
  success,
  paginatedSuccess,
  error,
};
