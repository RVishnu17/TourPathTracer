package tour.mapmapper.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class Mapcontroller {
@GetMapping("/")
    public String homepage(Model model)
{
    model.addAttribute("Greetings", "welcome da");
 return "homepage";
}
}
