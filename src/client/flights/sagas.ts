import { all, call, fork, put, takeEvery } from "redux-saga/effects";
import * as actions from "./actions";
import { getApi, deleteApi } from "../utils/api-facade";
import { formatDate } from "../../shared/utils/date";

function* handleCall(action, path, api = getApi) {
  try {
    const res = yield call(api, path);

    if (res.error) {
      yield put(action.failure(res.error));
    } else {
      yield put(action.success(res));
    }
  } catch (err) {
    if (err instanceof Error) {
      yield put(action.failure(err.stack!));
    } else {
      yield put(action.failure("An unknown error occured."));
    }
  }
}

function* handleFetchFlights() {
  return yield handleCall(actions.fetchFlights, "flights");
}

function* handleFetchFlightsPerDay(action) {
  return yield handleCall(
    actions.fetchFlightsPerDay,
    "flights/" + action.payload
  );
}

function* handleFetchFlight(action) {
  return yield handleCall(
    actions.fetchFlight,
    "flights/" + formatDate(action.payload.startDate) + "/" + action.payload.id
  );
}

function* handledeleteFlight(action) {
  return yield handleCall(
    actions.deleteFlight,
    "flights/" + formatDate(action.payload.startDate) + "/" + action.payload.id,
    deleteApi
  );
}

function* watchFetchFlightsRequest() {
  yield takeEvery(actions.fetchFlights.request, handleFetchFlights);
}

function* watchFetchFlightsPerDayRequest() {
  yield takeEvery(actions.fetchFlightsPerDay.request, handleFetchFlightsPerDay);
}

function* watchFetchFlightRequest() {
  yield takeEvery(actions.fetchFlight.request, handleFetchFlight);
}

function* watchDeleteFlightRequest() {
  yield takeEvery(actions.deleteFlight.request, handledeleteFlight);
}

// We can also use `fork()` here to split our saga into multiple watchers.
export function* flightsSaga() {
  yield all([
    fork(watchFetchFlightsRequest),
    fork(watchFetchFlightsPerDayRequest),
    fork(watchFetchFlightRequest),
    fork(watchDeleteFlightRequest)
  ]);
}
