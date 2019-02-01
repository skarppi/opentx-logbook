import * as React from "react";
import { Button, FormControl } from "@material-ui/core";
import { Flight } from "../../../../shared/flights/types";
import { FlightBattery } from "./FlightBattery";
import AddIcon from "@material-ui/icons/Add";
import { RootState } from "../../../app";
import { connect } from "react-redux";
import {
  insertBatteryCycle,
  deleteBatteryCycle,
  updateBatteryCycle
} from "../../batteries/actions";
import { planes } from "./Flight";
import { BatteryState } from "../../../../shared/batteries";
import { BatteryCycle } from "../../../../shared/batteries/types";
import { getFlight } from "../selectors";
const css = require("./Flight.css");

export interface OwnProps {
  id: string;
}

interface BatteryProps {
  flight: Flight;
  cycles: { [key: string]: BatteryCycle };
}

type AllProps = BatteryProps & typeof mapDispatchToProps;

class FlightBatteries extends React.Component<AllProps> {
  addBattery = _ => {
    const { flight } = this.props;

    const lastSegment = flight.segments.slice(-1)[0];
    const lastTelemetry = lastSegment.rows.slice(-1)[0];

    const usedBatteries = flight.batteries.map(b => b.batteryId);

    this.props.insertBatteryCycle({
      id: -1,
      date: flight.startDate,
      batteryId: planes[flight.plane].batteries.find(
        id => usedBatteries.indexOf(id) === -1
      ),
      flightId: flight.id,
      state: BatteryState.discharged,
      voltage: lastTelemetry && lastTelemetry["VFAS(V)"],
      discharged: lastTelemetry && lastTelemetry["Fuel(mAh)"],
      charged: null
    });
  };

  render() {
    const { cycles, flight } = this.props;
    const rows = Object.keys(cycles).map(id => {
      return (
        <FlightBattery
          key={id}
          flight={flight}
          battery={cycles[id]}
          update={this.props.updateBatteryCycle}
          delete={this.props.deleteBatteryCycle}
        />
      );
    });

    return (
      <>
        {rows}
        <FormControl className={css.formControl} margin="normal">
          <Button onClick={this.addBattery}>
            Add battery
            <AddIcon />
          </Button>
        </FormControl>
      </>
    );
  }
}

const mapStateToProps = (state: RootState, ownProps: OwnProps) => ({
  flight: getFlight(state, ownProps.id),
  cycles: state.batteries.cycles
});

const mapDispatchToProps = {
  insertBatteryCycle: insertBatteryCycle.request,
  updateBatteryCycle: updateBatteryCycle.request,
  deleteBatteryCycle: deleteBatteryCycle.request
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(FlightBatteries);
