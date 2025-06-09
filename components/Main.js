import React from 'react'

export default function Main(props) {
  const { children } = props;
  return (
    <main className='flex-1'>
      {children}
    </main>
  )
}
