import {
  Card,
  CardContent,
  CardHeader,
  Grid,
  Table,
  TableRow,
  TableCell,
  TableHead,
  TableBody
} from "@material-ui/core";
import * as React from "react";
import { NavLink, Route } from "react-router-dom";
import { RouteComponentProps } from "react-router";
import { fetchFlightDays } from "../actions";
import { FlightsState } from "../reducer";
import { connect } from "react-redux";
import { RootState } from "../../../app";
import { formatDuration } from "../../../../shared/utils/date";

import Flights from "../Flights/Flights";

import ClosedIcon from "@material-ui/icons/KeyboardArrowRight";
import OpenedIcon from "@material-ui/icons/KeyboardArrowDown";
import Loading from "../../loading/Loading/Loading";

const css = require("./FlightDays.css");

interface RouteParams {
  date: string;
}

type AllProps = FlightsState &
  typeof mapDispatchToProps &
  RouteComponentProps<RouteParams>;

class FlightDays extends React.Component<AllProps> {
  public render() {
    const { flightDays } = this.props;

    const rows = flightDays.map(flightDay => {
      const current = this.props.match.params.date === flightDay.date;

      const dayRow = (
        <TableRow key={String(flightDay.date)}>
          <TableCell>
            <NavLink to={`/flights/${flightDay.date}`}>
              {(current && <OpenedIcon />) || <ClosedIcon />}
              {flightDay.date}
            </NavLink>
          </TableCell>
          <TableCell>{flightDay.flights}</TableCell>
          <TableCell>{flightDay.planes}</TableCell>
          <TableCell>{formatDuration(flightDay.flightTime)}</TableCell>
        </TableRow>
      );

      const flightsRow = (
        <Route
          key={flightDay.date + "-route"}
          path={"/flights/:date(" + flightDay.date + ")/:id?"}
          render={props => (
            <TableRow key={flightDay.date + "-flights"} className={css.opened}>
              <TableCell colSpan={4}>
                <Flights {...props} />
              </TableCell>
            </TableRow>
          )}
        />
      );

      return [dayRow, flightsRow];
    });

    return (
      <>
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Flights List" />
            <CardContent className={css.loadingParent}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>#</TableCell>
                    <TableCell>Plane</TableCell>
                    <TableCell>Flight Time</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>{rows}</TableBody>
              </Table>
              <Loading actions={[fetchFlightDays]} overlay={true} />
            </CardContent>
          </Card>
        </Grid>
      </>
    );
  }

  public async componentWillMount() {
    this.props.fetchFlightDays();
  }
}

const mapStateToProps = (state: RootState) => ({
  flightDays: state.flights.flightDays
});

const mapDispatchToProps = {
  fetchFlightDays: fetchFlightDays.request
};

export default connect<any, any>(
  mapStateToProps,
  mapDispatchToProps
)(FlightDays);
