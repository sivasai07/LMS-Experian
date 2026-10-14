<?php

declare(strict_types=1);

namespace App\Http\Resources\Master;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GradeJobTitleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'        => $this->id,
            'grade_id'  => $this->grade_id,
            'job_title_id' => $this->job_title_id,
            'grade'     => $this->whenLoaded('grade', fn () => [
                'id'   => $this->grade->id,
                'code' => $this->grade->code,
            ]),
            'job_title' => $this->whenLoaded('jobTitle', fn () => [
                'id'    => $this->jobTitle->id,
                'title' => $this->jobTitle->title,
            ]),
            'label' => $this->whenLoaded('grade', fn () =>
                ($this->grade->code ?? '') . ' — ' . ($this->jobTitle->title ?? '')
            ),
        ];
    }
}
