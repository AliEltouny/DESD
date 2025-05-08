// components/events/EventCardSkeleton.tsx
const EventCardSkeleton = () => {
    return (
      <div className="animate-pulse bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="h-36 w-full bg-gray-200" />
        <div className="p-5 space-y-3">
          <div className="h-5 bg-gray-200 rounded w-2/3" />
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
          <div className="h-4 bg-gray-200 rounded w-3/4" />
        </div>
      </div>
    );
  };
  
  export default EventCardSkeleton;
  