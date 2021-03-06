import IconButton from '@material-ui/core/IconButton';
import TextField from '@material-ui/core/TextField';
import Divider from '@material-ui/core/Divider';
import * as React from 'react';
import { Flight } from '../../../../../shared/flights/types';
import { useHistory } from 'react-router-dom';

import { FlightDate } from './FlightDate';
import { FlightDuration } from './FlightDuration';
import { FlightBatteries } from './FlightBatteries';
import { FlightLocation } from './FlightLocation';
import { FlightStats } from './FlightStats';

import { Videos } from '../Videos/Videos';
import { FlightGraph } from './FlightGraph';

import { differenceInHours } from 'date-fns';

import DeleteIcon from '@material-ui/icons/Delete';
import HamburgerIcon from '@material-ui/icons/MoreVert';
import FavoriteIcon from '@material-ui/icons/Favorite';
import UnFavoriteIcon from '@material-ui/icons/FavoriteBorder';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

import { useQuery, useMutation } from 'urql';
import gql from 'graphql-tag';
import { Battery } from '../../../../../shared/batteries/types';
import { formatDate } from '../../../utils/date';
import { putApi } from '../../../utils/api-facade';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import { FlightTimezone } from './FlightTimezone';
import { FlightTrack } from './FlightTrack';
import Accordion from '@material-ui/core/Accordion';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import Box from '@material-ui/core/Box';
import { DetailsTemplate } from '../../../common/DetailsTemplate';

const Query = gql`
  query($id:String!) {
    flight(id: $id) {
      id
      session
      startDate
      endDate
      duration
      armedTime
      flightTime
      notes
      stats
      location {
        id
        name
        latitude
        longitude
      }
      favorite
      segments
      batteryCycles {
        nodes {
          id
          date
          batteryName
          flightId
          state
          restingVoltage
          startVoltage
          endVoltage
          discharged
          charged
          resistance
        }
      }
      plane {
        id
        type
        telemetries
        batterySlots
        planeBatteries {
          nodes {
            batteryName
          }
        }
      }
    }
    batteries(orderBy:NAME_ASC) {
      nodes {
        id
        name
        cells
      }
    }
  }`;

const Update = gql`
  mutation($id:String!, $patch:FlightPatch!) {
    updateFlight(input: {id: $id, patch: $patch}) {
      flight {
        id
        session
        startDate
        endDate
        duration
        armedTime
        flightTime
        notes
      }
    }
  }`;

const Delete = gql`
  mutation($id:String!) {
    deleteFlight(input: {id: $id}) {
      flight {
        id
      }
    }
  }`;


interface IQueryResponse {
  flight: Flight;
  batteries: {
    nodes: Battery[];
  };
}

export const FlightDetails = ({ entry, path, nextLink, previousLink }) => {

  const history = useHistory();

  const [timezoneOffset, setTimezoneOffset] = React.useState(-new Date().getTimezoneOffset() / 60);
  const [anchorEl, setAnchorEl] = React.useState(null);

  const [read, refreshFlight] = useQuery<IQueryResponse>({
    query: Query,
    variables: { id: entry.id }
  });
  const [update, updateFlight] = useMutation(Update);
  const [del, deleteFlight] = useMutation(Delete);

  // local state
  const [flight, setFlight] = React.useState<Flight>(entry);
  React.useEffect(() => {
    if (read.data) {
      setFlight(read.data.flight);

      if (flight.segments && flight.segments[0]) {
        const row = flight.segments[0].rows[0];
        const originalStartDate = new Date(`${row.Date} ${row.Time}`);
        const currentStartDate = new Date(flight.startDate);

        const offset = -(originalStartDate.getTimezoneOffset() / 60 + differenceInHours(currentStartDate, originalStartDate));

        setTimezoneOffset(offset);
      }
    }
  }, [read.data]);

  const flightDate = formatDate(flight.startDate);

  const changeFavorite = () =>
    updateFlight({
      id: flight.id,
      patch: { favorite: flight.favorite ? 0 : 1 }
    });

  const changeNotes = ({ target: { name, value } }) =>
    setFlight({
      ...flight,
      notes: { ...flight.notes, [name]: value }
    });

  const saveNotes = () => updateFlight({
    id: flight.id,
    patch: { notes: flight.notes }
  });

  const executeReset = () => {
    setAnchorEl(null);
    putApi(`flights/${flightDate}/${flight.id}/reset`, null, {
      TIMEZONE_OFFSET: timezoneOffset
    }).then(res =>
      refreshFlight({ requestPolicy: 'network-only' })
    );
  };

  const executeDelete = () => {
    setAnchorEl(null);
    deleteFlight({ id: flight.id }).then(res => {
      if (!res.error) {
        history.push(`/flights/${flightDate}`);
      }
    });
  };

  function handleClick(event) {
    setAnchorEl(event.currentTarget);
  }

  function handleClose() {
    setAnchorEl(null);
  }

  return <DetailsTemplate
    type='flight'
    path={path}
    title={`Flight: ${flight.id}`}
    previousLink={previousLink}
    nextLink={nextLink}
    queries={[read, update, del]}
    action={
      <IconButton
        onClick={changeFavorite}>
        {flight.favorite ? <FavoriteIcon /> : <UnFavoriteIcon />}
      </IconButton>
    }
    menu={
      <>
        <IconButton
          aria-label='More'
          aria-controls='hamburger'
          aria-haspopup='true'
          onClick={handleClick}
        >
          <HamburgerIcon />
        </IconButton>
        <Menu
          id='hamburger'
          anchorEl={anchorEl}
          keepMounted
          open={Boolean(anchorEl)}
          onClose={handleClose}
        >

          <MenuItem key='Reset'>
            <FlightTimezone offset={timezoneOffset} onChange={setTimezoneOffset} />
            <ListItemText primary='Change timezone' onClick={executeReset} />
          </MenuItem>

          <MenuItem key='Delete' onClick={executeDelete}>
            <ListItemIcon>
              <DeleteIcon />
            </ListItemIcon>
            <ListItemText primary='Delete Flight' />
          </MenuItem>
        </Menu>
      </>
    }
    hidden={false}>
    <Box display='flex' flexWrap='wrap' justifyContent='stretch'>
      <FlightDate flight={flight} />
      <FlightDuration flight={flight} save={updateFlight} />
    </Box>

    <FlightLocation
      flight={flight}
      save={updateFlight} />

    <FlightStats flight={flight} />

    <Divider variant='middle' />

    <FlightBatteries
      flight={flight}
      batteries={read.data?.batteries.nodes || []}
      refreshFlight={() => refreshFlight({ requestPolicy: 'network-only' })}
    />

    <TextField
      id='jornal'
      label='Journal'
      placeholder='Journal'
      multiline
      value={(flight.notes?.journal) || ''}
      name='journal'
      onChange={changeNotes}
      onBlur={saveNotes}
      margin='normal'
      fullWidth={true}
    />

    <Box height='500px' width='92vw' maxWidth='1200px'>
      <FlightGraph flight={flight}></FlightGraph>
    </Box>

    <Accordion defaultExpanded={false}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        Show Map
          </AccordionSummary>
      <AccordionDetails>
        <FlightTrack flight={flight}></FlightTrack>
      </AccordionDetails>
    </Accordion>

    <Videos
      date={flight.startDate}
      plane={flight.planeId}
      session={flight.session}
    />
  </DetailsTemplate>
};