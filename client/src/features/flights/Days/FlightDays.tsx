import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';
import Grid from '@material-ui/core/Grid';
import Table from '@material-ui/core/Table';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableBody from '@material-ui/core/TableBody';
import * as React from 'react';
import { NavLink } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { formatDuration } from '../../../../../shared/utils/date';

import { Flights } from '../Flights/Flights';

import ClosedIcon from '@material-ui/icons/ChevronRight';
import OpenedIcon from '@material-ui/icons/ExpandMore';
import { Loading } from '../../loading/Loading';
import { useQuery } from 'urql';
import { ITotalRows } from '../../dashboard/Home/GraphOverTime';
import gql from 'graphql-tag';
import { formatDate, formatMonth } from '../../../utils/date';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import { Flight } from '../../../../../shared/flights/types';
import { parseISO } from 'date-fns';

const layout = require('../../../common/Layout.css');
const css = require('./FlightDays.css');

const Query = gql`
  query($orderBy:[FlightsByDaysOrderBy!]) {
    flightsByDays(orderBy: $orderBy) {
      nodes {
        date
        planeId
        flights
        totalTime
      }
    }
  }
`;

interface IQueryResponse {
  flightsByDays: {
    nodes: ITotalRows[]
  };
}

export interface IMonthTotals {
  month: string;
  flights: number;
  totalTime: number;
  days: IDayTotals[]
}

export interface IDayTotals {
  day: string;
  planes: string,
  flights: number;
  totalTime: number;
}

const groupFlightsPerMonthAndDay = (queryResponse: IQueryResponse) => {
  const flightsByDays = queryResponse?.flightsByDays.nodes || [];

  return flightsByDays.reduce((acc, obj) => {
    const month = formatMonth(obj.date);
    const day = formatDate(obj.date);

    const days = acc[month] || {};

    days[day] = (days[day] || []).concat(obj);

    acc[month] = days;
    return acc;
  }, {} as Record<string, Record<string, ITotalRows[]>>);
};

const calculateTotalsPerDay = ([day, flights]: [string, ITotalRows[]]): IDayTotals => {
  return {
    day,
    planes: flights.map(flight => flight.planeId).join(', '),
    flights: flights.reduce((sum, flight) => sum + flight.flights, 0),
    totalTime: flights.reduce((sum, flight) => sum + flight.totalTime, 0),
  }
};

const calculateTotalsPerMonthAndDay = (flightsPerMonthAndDay: Record<string, Record<string, ITotalRows[]>>): IMonthTotals[] => {
  return Object.entries(flightsPerMonthAndDay).map(([month, flightsPerDay]) => {
    const totalsPerDay = Object.entries(flightsPerDay).map(calculateTotalsPerDay);

    return {
      month,
      flights: totalsPerDay.reduce((sum, row) => sum + row.flights, 0),
      totalTime: totalsPerDay.reduce((sum, row) => sum + row.totalTime, 0),
      days: totalsPerDay
    };
  });
};

export const FlightDays = () => {

  const { date } = useParams();

  const [orderBy, setOrderBy] = React.useState('DATE_DESC');

  const [read] = useQuery<IQueryResponse>({ query: Query, variables: { orderBy } });

  const groupedFlights = groupFlightsPerMonthAndDay(read.data);
  const totalsPerMonthDays = calculateTotalsPerMonthAndDay(groupedFlights);

  const flightDayRows = (totals: IDayTotals) => {
    const isCurrent = date === totals.day;

    return <React.Fragment key={totals.day + '-day'}>
      <TableRow selected={isCurrent} hover={true}>
        <TableCell>
          {(isCurrent && <NavLink to={'/flights'}>
            <OpenedIcon />
            {totals.day}
          </NavLink>) || <NavLink to={`/flights/${totals.day}`}>
              <ClosedIcon />
              {totals.day}
            </NavLink>}
        </TableCell>
        <TableCell>{totals.flights}</TableCell>
        <TableCell>{totals.planes}</TableCell>
        <TableCell>{formatDuration(totals.totalTime)}</TableCell>
      </TableRow>
      {isCurrent && (
        <TableRow className={css.opened}>
          <TableCell colSpan={4}>
            <Flights />
          </TableCell>
        </TableRow>
      )}
    </React.Fragment>;
  };

  const getSorting = () => {
    const UP = orderBy.endsWith('_ASC') ? -1 : 1;
    const DOWN = orderBy.endsWith('_DESC') ? -1 : 1;

    if (orderBy.startsWith('FLIGHTS_')) {
      return (a: IMonthTotals, b: IMonthTotals) => a.flights > b.flights ? DOWN : UP;
    } else if (orderBy.startsWith('TOTAL_TIME_')) {
      return (a: IMonthTotals, b: IMonthTotals) => a.totalTime > b.totalTime ? DOWN : UP;
    } else {
      return () => null;
    }
  }

  const rows = totalsPerMonthDays.sort(getSorting()).map(monthTotals => {
    const dayRows = monthTotals.days.map(flightDayRows);

    return <React.Fragment key={monthTotals.month + '-month'}>
      <TableRow>
        <TableCell style={{ fontWeight: 'bold', height: 50 }}>
          {monthTotals.month}
        </TableCell>
        <TableCell style={{ fontWeight: 'bold' }} colSpan={2}>{monthTotals.flights}</TableCell>
        <TableCell style={{ fontWeight: 'bold' }}>{formatDuration(monthTotals.totalTime)}</TableCell>
      </TableRow>
      {dayRows}
    </React.Fragment >;
  });

  const sortLabel = (col: string, title: string) =>
    <TableSortLabel
      active={orderBy.startsWith(col)}
      direction={orderBy === `${col}_ASC` ? 'asc' : 'desc'}
      onClick={() => setOrderBy(orderBy === `${col}_DESC` ? `${col}_ASC` : `${col}_DESC`)}>
      {title}
    </TableSortLabel>;

  return (
    <>
      <Grid item xs={12} className={layout.grid}>
        <Card>
          <CardHeader title='Flights List' />
          <CardContent className={layout.loadingParent}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{sortLabel('DATE', 'Date')}</TableCell>
                  <TableCell>{sortLabel('FLIGHTS', 'Flights')}</TableCell>
                  <TableCell>Plane</TableCell>
                  <TableCell>{sortLabel('TOTAL_TIME', 'Flight Time')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>{rows}</TableBody>
            </Table>
            <Loading spinning={read.fetching} error={read.error} overlay={true} />
          </CardContent>
        </Card>
      </Grid>
    </>
  );
};