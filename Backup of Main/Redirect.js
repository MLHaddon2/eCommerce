import { useNavigate } from "react-router-dom";

function Redirect() {
  const navigate = useNavigate();
  navigate("/home");
};

export default Redirect;