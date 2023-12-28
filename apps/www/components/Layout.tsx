import Head from 'next/head';
import {ReactNode} from 'react';

interface Props {
  children: ReactNode;
}

export const Layout = ({children}: Props) => {
  return (
    <>
      <Head>
        <title>War Cats</title>
      </Head>
      {children}
    </>
  );
};
