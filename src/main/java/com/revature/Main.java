package com.revature;

import java.io.IOException;
import java.io.InputStream;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import com.revature.controller.AuthenticationController;
import com.revature.controller.IngredientController;
import com.revature.controller.RecipeController;
import com.revature.dao.ChefDAO;
import com.revature.dao.IngredientDAO;
import com.revature.dao.RecipeDAO;
import com.revature.service.AuthenticationService;
import com.revature.service.ChefService;
import com.revature.service.IngredientService;
import com.revature.service.RecipeService;
import com.revature.util.AdminMiddleware;
import com.revature.util.ConnectionUtil;
import com.revature.util.DBUtil;
import com.revature.util.JavalinAppUtil;

import io.javalin.Javalin;

/**
 * Allows manual or automated startup of the backend server.
 * Manual: runs on 8080 (fallbacks to next free port)
 * Tests: call startServer(8080, true) to auto-assign free port
 */
public class Main {

    private static final ConnectionUtil CONNECTION_UTIL = new ConnectionUtil();
    private static JavalinAppUtil JAVALIN_APP_UTIL;
    private static RecipeController RECIPE_CONTROLLER;
    private static RecipeService RECIPE_SERVICE;
    private static RecipeDAO RECIPE_DAO;
    private static ChefDAO CHEF_DAO;
    private static ChefService CHEF_SERVICE;
    private static AuthenticationService AUTH_SERVICE;
    private static AuthenticationController AUTH_CONTROLLER;
    private static IngredientDAO INGREDIENT_DAO;
    private static IngredientService INGREDIENT_SERVICE;
    private static IngredientController INGREDIENT_CONTROLLER;
    @SuppressWarnings("unused")
    private static AdminMiddleware ADMIN_MIDDLEWARE;

    public static void main(String[] args) {
        startServer(8080, true);
    }

    public static Javalin startServer(int preferredPort, boolean allowFallback) {

        // === Initialize dependencies ===
        INGREDIENT_DAO = new IngredientDAO(CONNECTION_UTIL);
        CHEF_DAO = new ChefDAO(CONNECTION_UTIL);
        RECIPE_DAO = new RecipeDAO(CHEF_DAO, INGREDIENT_DAO, CONNECTION_UTIL);
        CHEF_SERVICE = new ChefService(CHEF_DAO);
        AUTH_SERVICE = new AuthenticationService(CHEF_SERVICE);
        RECIPE_SERVICE = new RecipeService(RECIPE_DAO);
        RECIPE_CONTROLLER = new RecipeController(RECIPE_SERVICE, AUTH_SERVICE);
        INGREDIENT_SERVICE = new IngredientService(INGREDIENT_DAO);
        INGREDIENT_CONTROLLER = new IngredientController(INGREDIENT_SERVICE);
        AUTH_CONTROLLER = new AuthenticationController(CHEF_SERVICE, AUTH_SERVICE);
        JAVALIN_APP_UTIL = new JavalinAppUtil(RECIPE_CONTROLLER, AUTH_CONTROLLER, INGREDIENT_CONTROLLER);

        // Run any DB init scripts
        DBUtil.RUN_SQL();

        Javalin app = JAVALIN_APP_UTIL.getApp();

        int port = preferredPort;
        while (true) {
            try {
                app.start(port);
                System.out.println("Server started on port: " + port);
                break;
            } catch (Exception e) {
                if (allowFallback && e.getMessage() != null && e.getMessage().contains("Address already in use")) {
                    port++;
                    System.out.println("Port " + (port - 1) + " busy, retrying on " + port);
                } else {
                    throw e;
                }
            }
        }

        if (port == 8080) {
            int[] proxyPorts = { 8081, 8082, 8083 };

            for (int proxyPort : proxyPorts) {
                try {
                    Javalin proxy = Javalin.create(config -> {
                        // ✅ Enable simple permissive CORS
                        config.bundledPlugins.enableCors(cors -> {
                            cors.addRule(rule -> {
                                rule.reflectClientOrigin = true; // dynamically reflects the request's Origin
                                rule.allowCredentials = true;
                                rule.exposeHeader("Authorization");
                                rule.exposeHeader("Content-Type");

                            });
                        });
                    });

                    proxy.before(ctx -> {
                        if ("OPTIONS".equalsIgnoreCase(ctx.req().getMethod())) {
                            ctx.header("Access-Control-Allow-Origin", ctx.header("Origin"));
                            ctx.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
                            ctx.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
                            ctx.status(200);
                            return;
                        }

                        // Forward requests from proxy port to 8080
                        String target = "http://localhost:8080" + ctx.path();
                        if (ctx.queryString() != null && !ctx.queryString().isEmpty()) {
                            target += "?" + ctx.queryString();
                        }

                        HttpClient client = HttpClient.newHttpClient();
                        HttpRequest.BodyPublisher bodyPublisher = ctx.req().getContentLength() > 0
                                ? HttpRequest.BodyPublishers.ofInputStream(() -> {
                                    try {
                                        InputStream inputStream = ctx.req().getInputStream();
                                        return inputStream;
                                    } catch (IOException e) {
                                        throw new RuntimeException(e);
                                    }
                                })
                                : HttpRequest.BodyPublishers.noBody();

                        HttpRequest request = HttpRequest.newBuilder()
                                .uri(java.net.URI.create(target))
                                .method(ctx.req().getMethod(), bodyPublisher)
                                .headers("Content-Type", "application/json")
                                .build();

                        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

                        ctx.result(response.body());
                        ctx.status(response.statusCode());
                    });

                    proxy.start(proxyPort);
                    System.out.println("Forwarding proxy active: " + proxyPort + " → 8080");

                } catch (Exception e) {
                    System.out.println("Couldn't start proxy on " + proxyPort + ": " + e.getMessage());
                    e.printStackTrace();

                }
            }
        }

        return app;
    }
}
