import React from 'react';

const AnalyticsHeader = React.memo(({ metrics }) => {
  const {
    totalSubmitted,
    pending,
    companiesInterviewing,
    interviewRounds,
    offers,
    rejections,
    offerRate
  } = metrics;

  return (
    <>
      <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6 text-center'>
        <div className='bg-light-background dark:bg-dark-card dark:border dark:border-dark-accent p-3 rounded'>
          <div className='text-sm text-light-text dark:text-dark-text'>Submitted</div>
          <div className='text-xl font-semibold text-light-text dark:text-dark-text'>
            {totalSubmitted}
          </div>
        </div>
        <div className='bg-light-background dark:bg-dark-card dark:border dark:border-dark-accent p-3 rounded'>
          <div className='text-sm text-light-text dark:text-dark-text'>Pending</div>
          <div className='text-xl font-semibold text-light-text dark:text-dark-text'>
            {pending}
          </div>
        </div>
        <div className='bg-light-background dark:bg-dark-card dark:border dark:border-dark-accent p-3 rounded'>
          <div className='text-sm text-light-text dark:text-dark-text'>Interviewed Companies</div>
          <div className='text-xl font-semibold text-light-text dark:text-dark-text'>
            {companiesInterviewing}
          </div>
        </div>
        <div className='bg-light-background dark:bg-dark-card dark:border dark:border-dark-accent p-3 rounded'>
          <div className='text-sm text-light-text dark:text-dark-text'>Interview Rounds</div>
          <div className='text-xl font-semibold text-light-text dark:text-dark-text'>
            {interviewRounds}
          </div>
        </div>
        <div className='bg-light-background dark:bg-dark-card dark:border dark:border-dark-accent p-3 rounded'>
          <div className='text-sm text-light-text dark:text-dark-text'>Offers</div>
          <div className='text-xl font-semibold text-light-text dark:text-dark-text'>
            {offers}
          </div>
        </div>
        <div className='bg-light-background dark:bg-dark-card dark:border dark:border-dark-accent p-3 rounded'>
          <div className='text-sm text-light-text dark:text-dark-text'>Rejected</div>
          <div className='text-xl font-semibold text-light-text dark:text-dark-text'>
            {rejections}
          </div>
        </div>
      </div>

      <div className='bg-light-background dark:bg-dark-card dark:border dark:border-dark-accent p-3 rounded text-center mb-6'>
        <div className='text-sm text-light-text dark:text-dark-text'>Offer Rate</div>
        <div className='text-xl font-semibold text-light-text dark:text-dark-text'>
          {offerRate}
        </div>
      </div>
    </>
  );
});

export default AnalyticsHeader;
