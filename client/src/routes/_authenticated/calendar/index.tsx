// client/src/routes/calendar/index.tsx
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";
import { createFileRoute } from "@tanstack/react-router";
import {
  Calendar as CalendarIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  Edit,
  Filter,
  Grid,
  List,
  MapPin,
  Plus,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/calendar/")({
  component: CalendarScheduling,
});

// Mock event data
const MOCK_EVENTS = [
  {
    id: "event-1",
    title: "Property Viewing",
    description: "Showing Unit 201 to potential tenant",
    start: "2023-06-15T10:00:00",
    end: "2023-06-15T11:00:00",
    location: "Sobha Garden - Unit 201",
    type: "viewing",
    status: "confirmed",
    participants: [
      { id: "user-1", name: "Michael Davis", role: "agent" },
      { id: "prospect-1", name: "Jennifer White", role: "prospect" },
    ],
  },
  {
    id: "event-2",
    title: "Lease Signing",
    description: "Finalizing lease agreement for Unit 305",
    start: "2023-06-16T14:00:00",
    end: "2023-06-16T15:30:00",
    location: "Office - Meeting Room 2",
    type: "leasing",
    status: "confirmed",
    participants: [
      { id: "user-1", name: "Michael Davis", role: "agent" },
      { id: "prospect-2", name: "Robert Johnson", role: "prospect" },
    ],
  },
  {
    id: "event-3",
    title: "Maintenance Visit",
    description: "Fixing leaking faucet in Unit 101",
    start: "2023-06-14T09:00:00",
    end: "2023-06-14T10:00:00",
    location: "Sobha Garden - Unit 101",
    type: "maintenance",
    status: "confirmed",
    participants: [
      { id: "user-2", name: "John Smith", role: "maintenance" },
      { id: "tenant-1", name: "James Wilson", role: "tenant" },
    ],
  },
  {
    id: "event-4",
    title: "Property Inspection",
    description: "Quarterly inspection of Unit 212",
    start: "2023-06-15T13:00:00",
    end: "2023-06-15T14:00:00",
    location: "Crown Tower - Unit 212",
    type: "inspection",
    status: "confirmed",
    participants: [
      { id: "user-3", name: "Alice Brown", role: "caretaker" },
      { id: "tenant-3", name: "Emily Johnson", role: "tenant" },
    ],
  },
  {
    id: "event-5",
    title: "Lease Renewal Discussion",
    description: "Discussing lease renewal terms with tenant",
    start: "2023-06-16T10:00:00",
    end: "2023-06-16T11:00:00",
    location: "Office - Meeting Room 1",
    type: "leasing",
    status: "confirmed",
    participants: [
      { id: "user-1", name: "Michael Davis", role: "agent" },
      { id: "tenant-4", name: "David Miller", role: "tenant" },
    ],
  },
  {
    id: "event-6",
    title: "Property Viewing",
    description: "Showing Unit 503 to potential tenant",
    start: "2023-06-17T15:00:00",
    end: "2023-06-17T16:00:00",
    location: "Crown Tower - Unit 503",
    type: "viewing",
    status: "tentative",
    participants: [
      { id: "user-1", name: "Michael Davis", role: "agent" },
      { id: "prospect-3", name: "Sarah Thompson", role: "prospect" },
    ],
  },
  {
    id: "event-7",
    title: "Move-in Inspection",
    description: "Pre-move-in inspection of Unit 310",
    start: "2023-06-18T12:00:00",
    end: "2023-06-18T13:00:00",
    location: "Sobha Garden - Unit 310",
    type: "inspection",
    status: "confirmed",
    participants: [
      { id: "user-3", name: "Alice Brown", role: "caretaker" },
      { id: "tenant-5", name: "Jessica Parker", role: "tenant" },
    ],
  },
];

// Calendar view helpers
const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function CalendarScheduling() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<"month" | "week" | "day" | "list">(
    "month"
  );
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState(false);
  const [filterType, setFilterType] = useState<string[]>([]);

  // Calculate current view dates
  const getViewDates = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    if (viewMode === "month") {
      // Get first day of month
      const firstDay = new Date(year, month, 1);
      const startingDayOfWeek = firstDay.getDay();

      // Calculate days in previous month to display
      const daysFromPrevMonth = startingDayOfWeek;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevMonthYear = month === 0 ? year - 1 : year;
      const daysInPrevMonth = new Date(
        prevMonthYear,
        prevMonth + 1,
        0
      ).getDate();

      // Calculate days in current month
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      // Calculate total calendar days needed (typically 42 - six weeks)
      const totalDays = 42;
      const daysFromNextMonth = totalDays - daysInMonth - daysFromPrevMonth;

      const dates: Date[] = [];

      // Add days from previous month
      for (
        let i = daysInPrevMonth - daysFromPrevMonth + 1;
        i <= daysInPrevMonth;
        i++
      ) {
        dates.push(new Date(prevMonthYear, prevMonth, i));
      }

      // Add days from current month
      for (let i = 1; i <= daysInMonth; i++) {
        dates.push(new Date(year, month, i));
      }

      // Add days from next month
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextMonthYear = month === 11 ? year + 1 : year;
      for (let i = 1; i <= daysFromNextMonth; i++) {
        dates.push(new Date(nextMonthYear, nextMonth, i));
      }

      return dates;
    } else if (viewMode === "week") {
      // Get the first day of the week containing the current date
      const day = currentDate.getDay();
      const diff = currentDate.getDate() - day;
      const firstDayOfWeek = new Date(currentDate);
      firstDayOfWeek.setDate(diff);

      const dates: Date[] = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(firstDayOfWeek);
        date.setDate(firstDayOfWeek.getDate() + i);
        dates.push(date);
      }

      return dates;
    } else if (viewMode === "day") {
      return [new Date(currentDate)];
    }

    // Default to empty array for list view
    return [];
  };

  const calendarDates = getViewDates();

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return MOCK_EVENTS.filter((event) => {
      const eventDate = new Date(event.start).toISOString().split("T")[0];
      const matchesType =
        filterType.length === 0 || filterType.includes(event.type);
      return eventDate === dateStr && matchesType;
    });
  };

  // Get all events for the current view
  const getAllEvents = () => {
    if (filterType.length === 0) {
      return MOCK_EVENTS;
    }
    return MOCK_EVENTS.filter((event) => filterType.includes(event.type));
  };

  // Navigation handlers
  const goToPrev = () => {
    const newDate = new Date(currentDate);

    if (viewMode === "month") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (viewMode === "week") {
      newDate.setDate(newDate.getDate() - 7);
    } else if (viewMode === "day") {
      newDate.setDate(newDate.getDate() - 1);
    }

    setCurrentDate(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(currentDate);

    if (viewMode === "month") {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (viewMode === "week") {
      newDate.setDate(newDate.getDate() + 7);
    } else if (viewMode === "day") {
      newDate.setDate(newDate.getDate() + 1);
    }

    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Handle event click
  const handleEventClick = (eventId: string) => {
    setSelectedEvent(eventId);
    setShowEventModal(true);
    setNewEvent(false);
  };

  // Get event by ID
  const getEventById = (eventId: string) => {
    return MOCK_EVENTS.find((event) => event.id === eventId);
  };

  // Get formatted view title
  const getViewTitle = () => {
    const month = MONTHS[currentDate.getMonth()];
    const year = currentDate.getFullYear();

    if (viewMode === "month") {
      return `${month} ${year}`;
    } else if (viewMode === "week") {
      const firstDay = calendarDates[0];
      const lastDay = calendarDates[6];

      const firstMonth = MONTHS[firstDay.getMonth()];
      const lastMonth = MONTHS[lastDay.getMonth()];

      if (firstMonth === lastMonth) {
        return `${firstMonth} ${firstDay.getDate()}-${lastDay.getDate()}, ${year}`;
      } else {
        return `${firstMonth} ${firstDay.getDate()} - ${lastMonth} ${lastDay.getDate()}, ${year}`;
      }
    } else if (viewMode === "day") {
      const day = currentDate.getDate();
      return `${month} ${day}, ${year}`;
    } else {
      return `Events`;
    }
  };

  // Toggle event type filter
  const toggleFilter = (type: string) => {
    setFilterType((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Calendar</h1>
        <Button
          onClick={() => {
            setNewEvent(true);
            setSelectedEvent(null);
            setShowEventModal(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Event
        </Button>
      </div>

      {/* Calendar Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToPrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={goToNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-medium ml-2">{getViewTitle()}</h2>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === "month" ? "default" : "ghost"}
              size="sm"
              className="h-9"
              onClick={() => setViewMode("month")}
            >
              <Grid className="h-4 w-4 mr-1" />
              Month
            </Button>
            <Button
              variant={viewMode === "week" ? "default" : "ghost"}
              size="sm"
              className="h-9"
              onClick={() => setViewMode("week")}
            >
              <Grid className="h-4 w-4 mr-1" />
              Week
            </Button>
            <Button
              variant={viewMode === "day" ? "default" : "ghost"}
              size="sm"
              className="h-9"
              onClick={() => setViewMode("day")}
            >
              <CalendarIcon className="h-4 w-4 mr-1" />
              Day
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              className="h-9"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4 mr-1" />
              List
            </Button>
          </div>

          <div className="relative">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>

            {/* Filter dropdown would go here */}
          </div>
        </div>
      </div>

      {/* Event Type Filters */}
      <div className="flex flex-wrap gap-2">
        <FilterButton
          label="Viewings"
          type="viewing"
          active={filterType.includes("viewing")}
          onClick={() => toggleFilter("viewing")}
        />
        <FilterButton
          label="Leasing"
          type="leasing"
          active={filterType.includes("leasing")}
          onClick={() => toggleFilter("leasing")}
        />
        <FilterButton
          label="Maintenance"
          type="maintenance"
          active={filterType.includes("maintenance")}
          onClick={() => toggleFilter("maintenance")}
        />
        <FilterButton
          label="Inspections"
          type="inspection"
          active={filterType.includes("inspection")}
          onClick={() => toggleFilter("inspection")}
        />
      </div>

      {/* Calendar Views */}
      <div className="bg-card border rounded-lg overflow-hidden">
        {/* Month View */}
        {viewMode === "month" && (
          <div>
            {/* Days of Week Header */}
            <div className="grid grid-cols-7 bg-muted/50 border-b">
              {DAYS_OF_WEEK.map((day, index) => (
                <div
                  key={index}
                  className="p-2 text-center text-sm font-medium"
                >
                  {day.slice(0, 3)}
                </div>
              ))}
            </div>

            {/* Calendar Dates */}
            <div className="grid grid-cols-7 auto-rows-fr">
              {calendarDates.map((date, index) => {
                const isCurrentMonth =
                  date.getMonth() === currentDate.getMonth();
                const isToday =
                  date.toDateString() === new Date().toDateString();
                const events = getEventsForDate(date);

                return (
                  <div
                    key={index}
                    className={`min-h-28 border-b border-r p-1 ${
                      !isCurrentMonth ? "bg-muted/20 text-muted-foreground" : ""
                    } ${isToday ? "bg-primary/5" : ""}`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span
                        className={`text-sm rounded-full w-6 h-6 flex items-center justify-center ${
                          isToday
                            ? "bg-primary text-primary-foreground font-medium"
                            : ""
                        }`}
                      >
                        {date.getDate()}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {events.length > 0
                          ? `${events.length} event${
                              events.length > 1 ? "s" : ""
                            }`
                          : ""}
                      </span>
                    </div>
                    <div className="space-y-1 overflow-y-auto max-h-24">
                      {events.slice(0, 3).map((event) => (
                        <div
                          key={event.id}
                          className={`text-xs p-1 rounded truncate cursor-pointer ${getEventTypeStyle(
                            event.type
                          )}`}
                          onClick={() => handleEventClick(event.id)}
                        >
                          {formatTime(event.start)} {event.title}
                        </div>
                      ))}
                      {events.length > 3 && (
                        <div className="text-xs text-muted-foreground text-center">
                          + {events.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Week View */}
        {viewMode === "week" && (
          <div>
            {/* Time Column and Days Header */}
            <div className="grid grid-cols-8 bg-muted/50 border-b">
              <div className="p-2 text-center text-sm font-medium border-r">
                Time
              </div>
              {calendarDates.map((date, index) => {
                const isToday =
                  date.toDateString() === new Date().toDateString();
                return (
                  <div
                    key={index}
                    className={`p-2 text-center ${
                      isToday ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className="text-sm font-medium">
                      {DAYS_OF_WEEK[date.getDay()].slice(0, 3)}
                    </div>
                    <div className={`text-sm ${isToday ? "font-bold" : ""}`}>
                      {date.getDate()}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Week Calendar Body */}
            <div className="flex">
              {/* Time Column */}
              <div className="w-16 border-r">
                {Array.from({ length: 12 }).map((_, index) => {
                  const hour = index + 8; // Start from 8 AM
                  return (
                    <div
                      key={index}
                      className="h-20 border-b p-1 text-xs text-muted-foreground"
                    >
                      {hour > 12
                        ? `${hour - 12} PM`
                        : hour === 12
                        ? "12 PM"
                        : `${hour} AM`}
                    </div>
                  );
                })}
              </div>

              {/* Day Columns */}
              <div className="grid grid-cols-7 flex-1">
                {calendarDates.map((date, dateIndex) => (
                  <div key={dateIndex} className="border-r">
                    {Array.from({ length: 12 }).map((_, hourIndex) => {
                      const hour = hourIndex + 8; // Start from 8 AM
                      const dateStr = date.toISOString().split("T")[0];

                      // Find events for this hour
                      const hourEvents = MOCK_EVENTS.filter((event) => {
                        const eventDate = new Date(event.start)
                          .toISOString()
                          .split("T")[0];
                        const eventHour = new Date(event.start).getHours();
                        return (
                          eventDate === dateStr &&
                          eventHour === hour &&
                          (filterType.length === 0 ||
                            filterType.includes(event.type))
                        );
                      });

                      return (
                        <div
                          key={hourIndex}
                          className="h-20 border-b p-1 relative"
                        >
                          {hourEvents.map((event) => (
                            <div
                              key={event.id}
                              className={`absolute inset-x-1 text-xs p-1 rounded cursor-pointer overflow-hidden ${getEventTypeStyle(
                                event.type
                              )}`}
                              style={{
                                top: `${
                                  (new Date(event.start).getMinutes() / 60) *
                                  100
                                }%`,
                                height: `${calculateEventDuration(
                                  event.start,
                                  event.end
                                )}%`,
                                minHeight: "20px",
                                maxHeight: "100%",
                              }}
                              onClick={() => handleEventClick(event.id)}
                            >
                              <div className="font-medium">{event.title}</div>
                              <div>
                                {formatTime(event.start)} -{" "}
                                {formatTime(event.end)}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Day View */}
        {viewMode === "day" && (
          <div>
            <div className="grid grid-cols-1 p-4 space-y-4">
              {Array.from({ length: 12 }).map((_, index) => {
                const hour = index + 8; // Start from 8 AM
                const timeStr =
                  hour > 12
                    ? `${hour - 12}:00 PM`
                    : hour === 12
                    ? "12:00 PM"
                    : `${hour}:00 AM`;
                const currentDateStr = currentDate.toISOString().split("T")[0];

                // Find events for this hour
                const hourEvents = MOCK_EVENTS.filter((event) => {
                  const eventDate = new Date(event.start)
                    .toISOString()
                    .split("T")[0];
                  const eventHour = new Date(event.start).getHours();
                  return (
                    eventDate === currentDateStr &&
                    eventHour === hour &&
                    (filterType.length === 0 || filterType.includes(event.type))
                  );
                });

                return (
                  <div key={index} className="flex">
                    <div className="w-20 pt-2 text-sm text-muted-foreground">
                      {timeStr}
                    </div>
                    <div className="flex-1 border-l pl-4">
                      {hourEvents.length > 0 ? (
                        <div className="space-y-2">
                          {hourEvents.map((event) => (
                            <div
                              key={event.id}
                              className={`p-2 rounded cursor-pointer ${getEventTypeStyle(
                                event.type
                              )}`}
                              onClick={() => handleEventClick(event.id)}
                            >
                              <div className="flex justify-between">
                                <h3 className="font-medium">{event.title}</h3>
                                <span className="text-sm">
                                  {formatTime(event.start)} -{" "}
                                  {formatTime(event.end)}
                                </span>
                              </div>
                              <p className="text-sm mt-1">
                                {event.description}
                              </p>
                              <div className="flex items-center mt-2 text-sm">
                                <MapPin className="h-3 w-3 mr-1" />
                                <span>{event.location}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="h-12 border border-dashed rounded-md flex items-center justify-center text-sm text-muted-foreground">
                          No events
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* List View */}
        {viewMode === "list" && (
          <div className="divide-y">
            {getAllEvents().length > 0 ? (
              getAllEvents()
                .sort(
                  (a, b) =>
                    new Date(a.start).getTime() - new Date(b.start).getTime()
                )
                .map((event) => (
                  <div
                    key={event.id}
                    className="p-4 hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleEventClick(event.id)}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex items-center">
                        <div
                          className={`w-3 h-3 rounded-full mr-3 ${getEventTypeDot(
                            event.type
                          )}`}
                        ></div>
                        <div>
                          <h3 className="font-medium">{event.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {event.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="text-sm font-medium">
                          {new Date(event.start).toLocaleDateString()} ·{" "}
                          {formatTime(event.start)} - {formatTime(event.end)}
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3 mr-1" />
                          <span>{event.location}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center mt-2 text-sm">
                      <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                      <span>
                        {event.participants.map((p) => p.name).join(", ")}
                      </span>
                    </div>
                  </div>
                ))
            ) : (
              <div className="py-12 text-center">
                <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No events found</h3>
                <p className="text-muted-foreground">
                  {filterType.length > 0
                    ? "Try adjusting your filters or create a new event."
                    : "Your calendar is empty. Create your first event."}
                </p>
                <Button
                  className="mt-4"
                  onClick={() => {
                    setNewEvent(true);
                    setSelectedEvent(null);
                    setShowEventModal(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Event
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Event Modal */}
      {showEventModal && (
        <EventModal
          event={selectedEvent ? getEventById(selectedEvent) : null}
          isNew={newEvent}
          onClose={() => setShowEventModal(false)}
        />
      )}
    </div>
  );
}

// Helper functions
const formatTime = (dateTimeStr: string) => {
  const date = new Date(dateTimeStr);
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";

  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'

  return `${hours}:${minutes.toString().padStart(2, "0")} ${ampm}`;
};

const calculateEventDuration = (start: string, end: string) => {
  const startDate = new Date(start);
  const endDate = new Date(end);

  // Get difference in milliseconds
  const diff = endDate.getTime() - startDate.getTime();

  // Convert to minutes
  const diffMinutes = diff / (1000 * 60);

  // Calculate percentage of an hour (assuming each hour cell is 60 minutes)
  return (diffMinutes / 60) * 100;
};

const getEventTypeStyle = (type: string) => {
  switch (type) {
    case "viewing":
      return "bg-blue-100 text-blue-800 hover:bg-blue-200";
    case "leasing":
      return "bg-purple-100 text-purple-800 hover:bg-purple-200";
    case "maintenance":
      return "bg-amber-100 text-amber-800 hover:bg-amber-200";
    case "inspection":
      return "bg-green-100 text-green-800 hover:bg-green-200";
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-200";
  }
};

const getEventTypeDot = (type: string) => {
  switch (type) {
    case "viewing":
      return "bg-blue-500";
    case "leasing":
      return "bg-purple-500";
    case "maintenance":
      return "bg-amber-500";
    case "inspection":
      return "bg-green-500";
    default:
      return "bg-gray-500";
  }
};

// Helper Components
const FilterButton = ({ label, type, active, onClick }) => (
  <button
    className={`px-3 py-1 rounded-full text-sm font-medium flex items-center ${
      active
        ? getEventTypeStyle(type)
        : "bg-muted/50 text-muted-foreground hover:bg-muted"
    }`}
    onClick={onClick}
  >
    <div className={`w-2 h-2 rounded-full mr-2 ${getEventTypeDot(type)}`}></div>
    {label}
  </button>
);

// Event Modal Component
const EventModal = ({ event, isNew, onClose }) => {
  const [formData, setFormData] = useState({
    title: event?.title || "",
    description: event?.description || "",
    location: event?.location || "",
    type: event?.type || "viewing",
    start: event?.start || new Date().toISOString().slice(0, 16),
    end:
      event?.end ||
      new Date(new Date().getTime() + 60 * 60 * 1000)
        .toISOString()
        .slice(0, 16),
    status: event?.status || "confirmed",
    participants: event?.participants || [],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submit form data:", formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-medium">
            {isNew ? "Create New Event" : "Event Details"}
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium">Event Title</label>
            <input
              type="text"
              className="w-full p-2 border rounded-md"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              disabled={!isNew && event?.status === "completed"}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium">Description</label>
            <textarea
              className="w-full p-2 border rounded-md"
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              disabled={!isNew && event?.status === "completed"}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium">Event Type</label>
              <select
                className="w-full p-2 border rounded-md"
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
                disabled={!isNew && event?.status === "completed"}
              >
                <option value="viewing">Property Viewing</option>
                <option value="leasing">Leasing</option>
                <option value="maintenance">Maintenance</option>
                <option value="inspection">Inspection</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium">Location</label>
              <input
                type="text"
                className="w-full p-2 border rounded-md"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                disabled={!isNew && event?.status === "completed"}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium">
                Start Date & Time
              </label>
              <input
                type="datetime-local"
                className="w-full p-2 border rounded-md"
                value={formData.start}
                onChange={(e) =>
                  setFormData({ ...formData, start: e.target.value })
                }
                disabled={!isNew && event?.status === "completed"}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium">
                End Date & Time
              </label>
              <input
                type="datetime-local"
                className="w-full p-2 border rounded-md"
                value={formData.end}
                onChange={(e) =>
                  setFormData({ ...formData, end: e.target.value })
                }
                disabled={!isNew && event?.status === "completed"}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium">Status</label>
            <select
              className="w-full p-2 border rounded-md"
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
            >
              <option value="confirmed">Confirmed</option>
              <option value="tentative">Tentative</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Participants</label>
            {formData.participants.length > 0 ? (
              <div className="space-y-2">
                {formData.participants.map((participant, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 border rounded-md"
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="ml-2">
                        <p className="text-sm font-medium">
                          {participant.name}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {participant.role}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      className="h-8 w-8"
                      disabled={!isNew && event?.status === "completed"}
                      onClick={() => {
                        setFormData({
                          ...formData,
                          participants: formData.participants.filter(
                            (_, i) => i !== index
                          ),
                        });
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 border border-dashed rounded-md text-center text-sm text-muted-foreground">
                No participants added yet
              </div>
            )}

            <Button
              variant="outline"
              type="button"
              className="w-full mt-2"
              disabled={!isNew && event?.status === "completed"}
              onClick={() => {
                // In a real app, this would open a modal or dropdown to select participants
                setFormData({
                  ...formData,
                  participants: [
                    ...formData.participants,
                    {
                      id: `user-${Date.now()}`,
                      name: "New Participant",
                      role: "agent",
                    },
                  ],
                });
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Participant
            </Button>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            {event && !isNew && (
              <Button
                variant="destructive"
                type="button"
                onClick={() => {
                  console.log("Delete event:", event.id);
                  onClose();
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isNew && event?.status === "completed"}
            >
              {isNew ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Create
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Update
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CalendarScheduling;
