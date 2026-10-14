<?php

declare(strict_types=1);

namespace App\Traits;

use Illuminate\Http\JsonResponse;

trait ApiResponseTrait
{
    /**
     * Return a standard success JSON envelope.
     *
     * @param  mixed       $data    Response payload (model, array, resource, etc.)
     * @param  string      $message Human-readable success message
     * @param  int         $status  HTTP status code (default 200)
     * @param  array|null  $meta    Optional pagination or extra metadata
     */
    protected function success(
        mixed $data = null,
        string $message = '',
        int $status = 200,
        ?array $meta = null
    ): JsonResponse {
        $response = [
            'success' => true,
            'message' => $message,
            'data'    => $data,
        ];

        if ($meta !== null) {
            $response['meta'] = $meta;
        }

        return response()->json($response, $status);
    }

    /**
     * Return a standard paginated success JSON envelope.
     *
     * @param  mixed                                              $data       Resource collection
     * @param  \Illuminate\Contracts\Pagination\LengthAwarePaginator  $paginator  The paginator instance
     * @param  string                                             $message    Optional message
     */
    protected function paginatedSuccess(
        mixed $data,
        \Illuminate\Contracts\Pagination\LengthAwarePaginator $paginator,
        string $message = '',
    ): JsonResponse {
        return $this->success($data, $message, meta: [
            'current_page' => $paginator->currentPage(),
            'per_page'     => $paginator->perPage(),
            'total'        => $paginator->total(),
            'last_page'    => $paginator->lastPage(),
        ]);
    }

    /**
     * Return a standard error JSON envelope.
     *
     * @param  string  $message Human-readable error message
     * @param  array   $errors  Optional validation or additional error details
     * @param  string  $code    Optional application-specific error code
     * @param  int     $status  HTTP status code (default 400)
     */
    protected function error(
        string $message,
        array $errors = [],
        string $code = '',
        int $status = 400
    ): JsonResponse {
        return response()->json([
            'success' => false,
            'message' => $message,
            'errors'  => $errors,
            'code'    => $code,
        ], $status);
    }
}
