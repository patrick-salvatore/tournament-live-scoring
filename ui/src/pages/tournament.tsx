import { useParams, Router, Route } from "@solidjs/router";
import Home from "./home";

export default function Tournament() {
  const params = useParams();

  return <>{params}</>;
  // <Router>
  //   <Route path="/" component={Tournament} />
  //   <Route path="/" component={Home} />
  // </Router>
}
