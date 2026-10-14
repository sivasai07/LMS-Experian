<?php

declare(strict_types=1);

namespace App\Services\Leave;

use App\Models\Holiday;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Collection as SupportCollection;

class HolidayService
{
    /** @return Collection<int, Holiday> */
    public function all(): Collection
    {
        return Holiday::orderBy('holiday_date')->get();
    }

    public function findById(int $id): Holiday
    {
        return Holiday::findOrFail($id);
    }

    /** @param array<string, mixed> $data */
    public function create(array $data): Holiday
    {
        return Holiday::create($data);
    }

    /** @param array<string, mixed> $data */
    public function update(int $id, array $data): Holiday
    {
        $holiday = $this->findById($id);
        $holiday->update($data);

        return $holiday->refresh();
    }

    public function delete(int $id): void
    {
        $this->findById($id)->delete();
    }

    /**
     * Get all holiday dates for a given year as 'Y-m-d' strings.
     *
     * @return SupportCollection<int, string>
     */
    public function getHolidayDatesForYear(int $year): SupportCollection
    {
        return Holiday::whereYear('holiday_date', $year)
            ->get()
            ->map(fn (Holiday $h): string => $h->holiday_date->format('Y-m-d'))
            ->values();
    }
}
